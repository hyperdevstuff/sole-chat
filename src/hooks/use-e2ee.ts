"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/client";
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedKey,
  encrypt,
  decrypt,
  storePrivateKey,
  getPrivateKey,
} from "@/lib/crypto";

type E2EEStatus = "initializing" | "waiting" | "ready" | "error" | "disabled";

interface UseE2EEOptions {
  roomId: string;
  username: string;
}

export function useE2EE({ roomId, username }: UseE2EEOptions) {
  const [status, setStatus] = useState<E2EEStatus>("initializing");
  const [error, setError] = useState<string | null>(null);
  const sharedKeyRef = useRef<CryptoKey | null>(null);
  const privateKeyRef = useRef<CryptoKey | null>(null);
  const isCreatorRef = useRef<boolean | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current || !roomId || !username) return;
    initRef.current = true;

    const init = async () => {
      try {
        const infoRes = await api.rooms({ roomId }).info.get();
        if (infoRes.error) throw new Error("Failed to fetch room info");
        
        const roomInfo = infoRes.data as { type: string; e2ee: boolean };
        
        if (!roomInfo.e2ee || roomInfo.type === "group") {
          setStatus("disabled");
          return;
        }

        const storedKeyData = getPrivateKey(roomId);
        const keysRes = await api.rooms({ roomId }).keys.get();
        if (keysRes.error) throw new Error("Failed to fetch keys");

        const { creatorPublicKey, joinerPublicKey } = keysRes.data as {
          creatorPublicKey: string | null;
          joinerPublicKey: string | null;
        };

        if (storedKeyData) {
          isCreatorRef.current = storedKeyData.isCreator;
          privateKeyRef.current = storedKeyData.key;

          const peerPublicKey = storedKeyData.isCreator ? joinerPublicKey : creatorPublicKey;

          if (peerPublicKey) {
            const peerKey = await importPublicKey(peerPublicKey);
            sharedKeyRef.current = await deriveSharedKey(storedKeyData.key, peerKey);
            setStatus("ready");
          } else {
            setStatus("waiting");
          }
        } else {
          isCreatorRef.current = false;
          const keyPair = await generateKeyPair();
          privateKeyRef.current = keyPair.privateKey;
          storePrivateKey(roomId, keyPair.privateKey, false);
          const myPublicKey = await exportPublicKey(keyPair.publicKey);

          if (creatorPublicKey) {
            const peerKey = await importPublicKey(creatorPublicKey);
            sharedKeyRef.current = await deriveSharedKey(keyPair.privateKey, peerKey);
            await api.rooms({ roomId }).keys.put({ publicKey: myPublicKey, username });
            setStatus("ready");
          } else {
            setStatus("error");
            setError("Room creator key not found");
          }
        }
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "E2EE initialization failed");
      }
    };

    init();
  }, [roomId, username]);

  const handleKeyExchange = useCallback(
    async (peerPublicKey: string) => {
      if (!privateKeyRef.current || sharedKeyRef.current || status === "disabled") return;
      try {
        const peerKey = await importPublicKey(peerPublicKey);
        sharedKeyRef.current = await deriveSharedKey(privateKeyRef.current, peerKey);
        setStatus("ready");
      } catch {
        setStatus("error");
        setError("Key exchange failed");
      }
    },
    [status]
  );

  const encryptMessage = useCallback(async (plaintext: string): Promise<string> => {
    if (!sharedKeyRef.current || status === "disabled") return plaintext;
    return encrypt(plaintext, sharedKeyRef.current);
  }, [status]);

  const decryptMessage = useCallback(async (ciphertext: string): Promise<string> => {
    if (!sharedKeyRef.current || status === "disabled") return ciphertext;
    try {
      return await decrypt(ciphertext, sharedKeyRef.current);
    } catch {
      return "[Decryption failed]";
    }
  }, [status]);

  return {
    status,
    error,
    isCreator: isCreatorRef.current,
    isEnabled: status !== "disabled",
    encryptMessage,
    decryptMessage,
    handleKeyExchange,
  };
}
