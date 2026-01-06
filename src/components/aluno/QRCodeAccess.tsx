import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCode, CheckCircle2, Ban, Loader2, AlertTriangle, CreditCard } from 'lucide-react';
import { useCreateCheckIn } from '@/hooks/useCheckIns';
import { useCheckAccessAllowed } from '@/hooks/useDelinquency';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface QRCodeAccessProps {
  leadId: string;
  leadName: string;
  status: string;
  unitId?: string;
}

export function QRCodeAccess({ leadId, leadName, status, unitId }: QRCodeAccessProps) {
  const isActive = status === 'ativo';
  const createCheckIn = useCreateCheckIn();
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  
  // Check for delinquency
  const { isLoading: delinquencyLoading, isBlocked, delinquency, blockReason } = useCheckAccessAllowed(leadId);
  
  // Generate QR code data with lead info
  const qrData = JSON.stringify({
    type: 'gym_access',
    leadId,
    timestamp: Date.now(),
  });

  const handleCheckIn = async () => {
    if (!unitId || !isActive || isBlocked) return;
    
    try {
      await createCheckIn.mutateAsync({
        unit_id: unitId,
        lead_id: leadId,
        method: 'qr_code',
      });
      setJustCheckedIn(true);
      setTimeout(() => setJustCheckedIn(false), 5000);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Determine if access is allowed
  const accessAllowed = isActive && !isBlocked;

  if (delinquencyLoading) {
    return (
      <Card className="card-glow">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <CardTitle>QR Code de Acesso</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Skeleton className="h-[224px] w-[224px] rounded-xl" />
          <Skeleton className="h-6 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`card-glow ${!accessAllowed ? 'opacity-80' : ''}`}>
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <CardTitle>QR Code de Acesso</CardTitle>
        </div>
        <CardDescription>
          Apresente na catraca para entrar
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {/* Delinquency Alert */}
        {isBlocked && delinquency && (
          <Alert variant="destructive" className="w-full">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acesso Bloqueado por Inadimplência</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Você possui {delinquency.overdueInvoices} fatura(s) em atraso 
                há {delinquency.daysPastDue} dias, totalizando R$ {delinquency.overdueAmount.toFixed(2)}.
              </p>
              <p className="text-sm">
                Regularize sua situação para liberar o acesso.
              </p>
              <Link to="/meu-app" className="inline-block">
                <Button variant="outline" size="sm" className="mt-2">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Ver Faturas
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Warning for upcoming delinquency */}
        {!isBlocked && delinquency?.isDelinquent && delinquency.daysPastDue > 0 && (
          <Alert className="w-full border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Atenção</AlertTitle>
            <AlertDescription>
              <p className="text-sm">
                Você possui {delinquency.overdueInvoices} fatura(s) em atraso há {delinquency.daysPastDue} dia(s).
                Após 5 dias de atraso, seu acesso será bloqueado.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* QR Code Display */}
        <div className={`relative p-4 bg-card border-2 rounded-xl ${accessAllowed ? 'border-primary' : 'border-destructive'}`}>
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG
              value={qrData}
              size={192}
              level="H"
              includeMargin={false}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>
          
          {/* Blocked Overlay - Status or Delinquency */}
          {!accessAllowed && (
            <div className="absolute inset-0 bg-destructive/90 rounded-xl flex flex-col items-center justify-center gap-2">
              <Ban className="h-12 w-12 text-destructive-foreground" />
              <span className="text-destructive-foreground font-bold text-lg">BLOQUEADO</span>
              {isBlocked && (
                <span className="text-destructive-foreground text-xs">INADIMPLÊNCIA</span>
              )}
            </div>
          )}
          
          {/* Check-in Success Overlay */}
          {justCheckedIn && (
            <div className="absolute inset-0 bg-success/90 rounded-xl flex flex-col items-center justify-center gap-2 animate-fade-in">
              <CheckCircle2 className="h-12 w-12 text-white" />
              <span className="text-white font-bold text-lg">CHECK-IN OK!</span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <Badge 
          variant={accessAllowed ? 'default' : 'destructive'}
          className="flex items-center gap-1"
        >
          {accessAllowed && <CheckCircle2 className="h-3 w-3" />}
          {accessAllowed ? 'Acesso Liberado' : isBlocked ? 'Bloqueado - Inadimplência' : 'Acesso Bloqueado'}
        </Badge>
        
        <p className="text-sm text-muted-foreground text-center">
          {leadName}
        </p>

        {/* Manual Check-in Button */}
        {accessAllowed && unitId && (
          <Button 
            onClick={handleCheckIn}
            disabled={createCheckIn.isPending || justCheckedIn}
            className="w-full"
            size="lg"
          >
            {createCheckIn.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : justCheckedIn ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Check-in Realizado!
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Fazer Check-in Manual
              </>
            )}
          </Button>
        )}

        {/* Blocked - No check-in button */}
        {!accessAllowed && (
          <p className="text-sm text-destructive text-center">
            {isBlocked 
              ? 'Regularize suas pendências financeiras para liberar o acesso.'
              : 'Entre em contato com a recepção.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
