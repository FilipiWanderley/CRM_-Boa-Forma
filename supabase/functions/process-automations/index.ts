import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutomationRule {
  id: string;
  unit_id: string;
  type: string;
  name: string;
  subject: string;
  message_template: string;
  trigger_days: number | null;
  channel: string;
  is_active: boolean;
}

interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  status: string;
  created_at: string;
  unit_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Starting automation processing...");

    // Get all active automation rules
    const { data: rules, error: rulesError } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("is_active", true);

    if (rulesError) {
      console.error("Error fetching rules:", rulesError);
      throw rulesError;
    }

    console.log(`Found ${rules?.length || 0} active rules`);

    const results = {
      welcome: 0,
      renewal_reminder: 0,
      birthday: 0,
      overdue: 0,
      inactivity: 0,
      errors: 0,
    };

    for (const rule of rules as AutomationRule[]) {
      try {
        console.log(`Processing rule: ${rule.name} (${rule.type})`);

        switch (rule.type) {
          case "welcome":
            results.welcome += await processWelcomeAutomation(supabase, rule);
            break;
          case "renewal_reminder":
            results.renewal_reminder += await processRenewalReminder(supabase, rule);
            break;
          case "birthday":
            results.birthday += await processBirthdayAutomation(supabase, rule);
            break;
          case "overdue":
            results.overdue += await processOverdueAutomation(supabase, rule);
            break;
          case "inactivity":
            results.inactivity += await processInactivityAutomation(supabase, rule);
            break;
        }
      } catch (error) {
        console.error(`Error processing rule ${rule.id}:`, error);
        results.errors++;
      }
    }

    console.log("Automation processing completed:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in process-automations:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Process welcome messages for new leads (created in last 24h without welcome sent)
async function processWelcomeAutomation(supabase: any, rule: AutomationRule): Promise<number> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Get new leads from this unit created in last 24h
  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .eq("unit_id", rule.unit_id)
    .gte("created_at", yesterday.toISOString());

  if (error || !leads) {
    console.error("Error fetching new leads:", error);
    return 0;
  }

  let count = 0;
  for (const lead of leads) {
    // Check if welcome was already sent
    const { data: existingLog } = await supabase
      .from("automation_logs")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("type", "welcome")
      .single();

    if (existingLog) continue;

    // Create automation log (pending - would be sent by email/whatsapp service)
    const message = replaceTemplateVariables(rule.message_template, lead);
    const subject = replaceTemplateVariables(rule.subject, lead);

    const { error: logError } = await supabase.from("automation_logs").insert({
      unit_id: rule.unit_id,
      rule_id: rule.id,
      lead_id: lead.id,
      type: "welcome",
      subject,
      message,
      recipient: lead.email || lead.phone,
      channel: rule.channel,
      status: "pending",
    });

    if (!logError) {
      count++;
      console.log(`Welcome automation queued for lead: ${lead.full_name}`);
    }
  }

  return count;
}

// Process renewal reminders (subscriptions expiring in X days)
async function processRenewalReminder(supabase: any, rule: AutomationRule): Promise<number> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + (rule.trigger_days || 30));
  const targetDateStr = targetDate.toISOString().split("T")[0];

  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      lead:leads(*)
    `)
    .eq("unit_id", rule.unit_id)
    .eq("status", "active")
    .eq("end_date", targetDateStr);

  if (error || !subscriptions) {
    console.error("Error fetching subscriptions:", error);
    return 0;
  }

  let count = 0;
  for (const sub of subscriptions) {
    const lead = sub.lead;
    if (!lead) continue;

    // Check if reminder was already sent for this subscription and trigger_days
    const { data: existingLog } = await supabase
      .from("automation_logs")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("rule_id", rule.id)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (existingLog) continue;

    const message = replaceTemplateVariables(rule.message_template, lead, { end_date: sub.end_date });
    const subject = replaceTemplateVariables(rule.subject, lead);

    const { error: logError } = await supabase.from("automation_logs").insert({
      unit_id: rule.unit_id,
      rule_id: rule.id,
      lead_id: lead.id,
      type: "renewal_reminder",
      subject,
      message,
      recipient: lead.email || lead.phone,
      channel: rule.channel,
      status: "pending",
    });

    if (!logError) {
      count++;
      console.log(`Renewal reminder queued for: ${lead.full_name} (expires ${sub.end_date})`);
    }
  }

  return count;
}

// Process birthday messages
async function processBirthdayAutomation(supabase: any, rule: AutomationRule): Promise<number> {
  const today = new Date();
  const monthDay = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .eq("unit_id", rule.unit_id)
    .not("birth_date", "is", null);

  if (error || !leads) {
    console.error("Error fetching leads for birthday:", error);
    return 0;
  }

  let count = 0;
  for (const lead of leads) {
    if (!lead.birth_date) continue;
    
    const leadMonthDay = lead.birth_date.substring(5, 10);
    if (leadMonthDay !== monthDay) continue;

    // Check if birthday message was already sent today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: existingLog } = await supabase
      .from("automation_logs")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("type", "birthday")
      .gte("created_at", todayStart.toISOString())
      .single();

    if (existingLog) continue;

    const message = replaceTemplateVariables(rule.message_template, lead);
    const subject = replaceTemplateVariables(rule.subject, lead);

    const { error: logError } = await supabase.from("automation_logs").insert({
      unit_id: rule.unit_id,
      rule_id: rule.id,
      lead_id: lead.id,
      type: "birthday",
      subject,
      message,
      recipient: lead.email || lead.phone,
      channel: rule.channel,
      status: "pending",
    });

    if (!logError) {
      count++;
      console.log(`Birthday message queued for: ${lead.full_name}`);
    }
  }

  return count;
}

// Process overdue payment reminders
async function processOverdueAutomation(supabase: any, rule: AutomationRule): Promise<number> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - (rule.trigger_days || 3));
  const targetDateStr = targetDate.toISOString().split("T")[0];

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(`
      *,
      lead:leads(*)
    `)
    .eq("unit_id", rule.unit_id)
    .eq("status", "overdue")
    .lte("due_date", targetDateStr);

  if (error || !invoices) {
    console.error("Error fetching overdue invoices:", error);
    return 0;
  }

  let count = 0;
  for (const invoice of invoices) {
    const lead = invoice.lead;
    if (!lead) continue;

    // Check if overdue reminder was already sent in last 3 days
    const { data: existingLog } = await supabase
      .from("automation_logs")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("type", "overdue")
      .eq("rule_id", rule.id)
      .gte("created_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (existingLog) continue;

    const message = replaceTemplateVariables(rule.message_template, lead, {
      amount: invoice.amount,
      due_date: invoice.due_date,
    });
    const subject = replaceTemplateVariables(rule.subject, lead);

    const { error: logError } = await supabase.from("automation_logs").insert({
      unit_id: rule.unit_id,
      rule_id: rule.id,
      lead_id: lead.id,
      type: "overdue",
      subject,
      message,
      recipient: lead.email || lead.phone,
      channel: rule.channel,
      status: "pending",
    });

    if (!logError) {
      count++;
      console.log(`Overdue reminder queued for: ${lead.full_name} (R$ ${invoice.amount})`);
    }
  }

  return count;
}

// Process inactivity alerts (no check-ins for X days)
async function processInactivityAutomation(supabase: any, rule: AutomationRule): Promise<number> {
  const inactiveDays = rule.trigger_days || 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

  // Get active leads with subscriptions
  const { data: activeLeads, error } = await supabase
    .from("leads")
    .select(`
      *,
      subscriptions!inner(status)
    `)
    .eq("unit_id", rule.unit_id)
    .eq("subscriptions.status", "active");

  if (error || !activeLeads) {
    console.error("Error fetching active leads:", error);
    return 0;
  }

  let count = 0;
  for (const lead of activeLeads) {
    // Get last check-in
    const { data: lastCheckIn } = await supabase
      .from("check_ins")
      .select("checked_in_at")
      .eq("lead_id", lead.id)
      .order("checked_in_at", { ascending: false })
      .limit(1)
      .single();

    // If no check-in or last check-in is older than cutoff
    if (lastCheckIn && new Date(lastCheckIn.checked_in_at) > cutoffDate) {
      continue;
    }

    // Check if inactivity alert was already sent in last 7 days
    const { data: existingLog } = await supabase
      .from("automation_logs")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("type", "inactivity")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (existingLog) continue;

    const message = replaceTemplateVariables(rule.message_template, lead, {
      inactive_days: inactiveDays,
    });
    const subject = replaceTemplateVariables(rule.subject, lead);

    const { error: logError } = await supabase.from("automation_logs").insert({
      unit_id: rule.unit_id,
      rule_id: rule.id,
      lead_id: lead.id,
      type: "inactivity",
      subject,
      message,
      recipient: lead.email || lead.phone,
      channel: rule.channel,
      status: "pending",
    });

    if (!logError) {
      count++;
      console.log(`Inactivity alert queued for: ${lead.full_name}`);
    }
  }

  return count;
}

// Replace template variables like {{name}}, {{email}}, etc.
function replaceTemplateVariables(template: string, lead: Lead, extra: Record<string, any> = {}): string {
  let result = template;
  
  result = result.replace(/\{\{nome\}\}/gi, lead.full_name);
  result = result.replace(/\{\{name\}\}/gi, lead.full_name);
  result = result.replace(/\{\{email\}\}/gi, lead.email || "");
  result = result.replace(/\{\{telefone\}\}/gi, lead.phone);
  result = result.replace(/\{\{phone\}\}/gi, lead.phone);
  
  for (const [key, value] of Object.entries(extra)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "gi");
    result = result.replace(regex, String(value));
  }
  
  return result;
}
