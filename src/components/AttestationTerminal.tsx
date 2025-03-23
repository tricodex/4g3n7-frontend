'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import ApiClient from '@/services/ApiClient';

type PCRValue = {
  id: number;
  value: string;
  description: string;
  status: 'verified' | 'mismatch' | 'unknown';
};

type AttestationResult = {
  status: 'verified' | 'failed' | 'in_progress' | 'not_started';
  enclaveIP: string;
  timestamp: string;
  pcrValues: PCRValue[];
  digest: string;
  pcrsVerified: number;
  pcrsTotal: number;
  error?: string;
};

export default function AttestationTerminal() {
  const [attestation, setAttestation] = useState<AttestationResult>({
    status: 'not_started',
    enclaveIP: '',
    timestamp: '',
    pcrValues: [],
    digest: '',
    pcrsVerified: 0,
    pcrsTotal: 0
  });
  
  const [loading, setLoading] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when terminal content changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [attestation]);

  // Function to start attestation verification process
  const verifyAttestation = async () => {
    setLoading(true);
    setAttestation({
      ...attestation,
      status: 'in_progress',
      timestamp: new Date().toISOString(),
    });

    // Use the real ApiClient to get attestation status
    try {
      const result = await ApiClient.getAttestationStatus();
      
      // Map API response to our component's state format
      setAttestation({
        status: result.status,
        enclaveIP: result.enclaveIP,
        timestamp: result.timestamp,
        pcrValues: result.pcrValues,
        digest: result.digest,
        pcrsVerified: result.pcrsVerified,
        pcrsTotal: result.pcrsTotal
      });
      
      if (result.status === 'verified') {
        toast.success('The CVM attestation has been successfully verified.');
      } else {
        toast.error(result.error || 'Failed to verify CVM attestation.');
      }
    } catch (error) {
      setAttestation({
        ...attestation,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error during attestation verification',
      });
      
      toast.error('Failed to verify CVM attestation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-black text-emerald-400 font-mono border-gray-700">
      <Toaster />
      <CardHeader>
        <CardTitle className="text-md">Attestation Verification Terminal</CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col overflow-hidden p-0">
        <div 
          ref={terminalRef} 
          className="flex-grow overflow-y-auto p-4 text-sm"
        >
          {attestation.status === 'not_started' && (
            <p className="text-yellow-300">
              Attestation verification has not been started. Click "Verify Attestation" to begin.
            </p>
          )}
          
          {attestation.status === 'in_progress' && (
            <>
              <p className="text-blue-300">[{new Date().toLocaleTimeString()}] Starting attestation verification...</p>
              <p className="text-blue-300">[{new Date().toLocaleTimeString()}] Connecting to Marlin CVM Attestation Service...</p>
              <div className="flex items-center mt-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-300 rounded-full border-t-transparent mr-2"></div>
                <p className="text-blue-300">Verification in progress...</p>
              </div>
            </>
          )}
          
          {attestation.status === 'verified' && (
            <>
              <p className="text-green-300">[{new Date(attestation.timestamp).toLocaleTimeString()}] Attestation verification started</p>
              <p className="text-green-300">[{new Date(attestation.timestamp).toLocaleTimeString()}] Connected to enclave: {attestation.enclaveIP}</p>
              <p className="text-green-300">[{new Date(attestation.timestamp).toLocaleTimeString()}] Retrieving attestation from enclave...</p>
              <p className="text-green-300">[{new Date(attestation.timestamp).toLocaleTimeString()}] Verifying attestation against expected values...</p>
              <p className="text-yellow-300">User Data Digest: {attestation.digest}</p>
              
              <p className="text-white mt-2">PCR Values Verification:</p>
              {attestation.pcrValues.map(pcr => (
                <p key={pcr.id} className={pcr.status === 'verified' ? 'text-green-300' : 'text-red-300'}>
                  PCR[{pcr.id}]: {pcr.value.substring(0, 10)}...{pcr.value.substring(pcr.value.length - 10)} - {pcr.description} - {pcr.status.toUpperCase()}
                </p>
              ))}
              
              <p className="text-green-300 mt-2 font-bold">
                ✓ Attestation verification successful! ({attestation.pcrsVerified}/{attestation.pcrsTotal} PCRs verified)
              </p>
              
              <p className="text-blue-300 mt-4">
                This confirms the Auto Trader is running in a secure Marlin CVM environment with verified code integrity.
              </p>
            </>
          )}
          
          {attestation.status === 'failed' && (
            <>
              <p className="text-red-300">[{new Date(attestation.timestamp).toLocaleTimeString()}] Attestation verification failed</p>
              <p className="text-red-300">Error: {attestation.error}</p>
              <p className="text-yellow-300 mt-2">
                Please check the enclave configuration and try again.
              </p>
            </>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          onClick={verifyAttestation}
          disabled={attestation.status === 'in_progress' || loading}
          className={`${loading ? 'animate-pulse' : ''}`}
          variant="default"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin mr-2">⟳</span>
              Verifying...
            </>
          ) : (
            attestation.status === 'verified' ? 'Re-verify Attestation' : 'Verify Attestation'
          )}
        </Button>
        
        {attestation.status === 'verified' && (
          <Button variant="outline" className="border-green-500 text-green-500 hover:bg-green-950">
            Export Attestation Report
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}