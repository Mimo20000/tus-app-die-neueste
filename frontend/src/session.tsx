import React, { createContext, useContext, useEffect, useState } from "react";
import { storage } from "@/src/utils/storage";
import { api, Player } from "@/src/api";
import { registerForPush } from "@/src/push";

const KEY = "tus.currentPlayerId";
const TOKEN_KEY = "tus.token";
// Fallback-Kopie des Tokens in AsyncStorage. AsyncStorage überlebt App-Updates
// (auch Android APK-Neubauten mit rotiertem Verschlüsselungs-Key des SecureStore)
// zuverlässiger als der Keychain/EncryptedSharedPreferences-Store. Wir schreiben
// den Token beim Login in BEIDE Stores und lesen bei Session-Restore zuerst
// SecureStore, dann AsyncStorage. Wenn SecureStore leer ist, wird er aus dem
// Fallback wieder befüllt -> Anmeldung bleibt bei einem Update vollständig
// erhalten.
const TOKEN_FALLBACK_KEY = "tus.tokenFallback";
const PLAYER_KEY = "tus.currentPlayer";

type SessionCtx = {
  ready: boolean;
  player: Player | null;
  players: Player[];
  reloadPlayers: () => Promise<void>;
  login: (p: Player, token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<SessionCtx>(null as any);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  const reloadPlayers = async () => {
    try {
      setPlayers(await api.players());
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const savedId = await storage.getItem<string | null>(KEY, null);
        // 1) SecureStore ist unsere primäre Token-Quelle.
        let token = await storage.secureGet<string | null>(TOKEN_KEY, null);
        // 2) Fallback: nach App-Updates kann der Keychain/ESP-Eintrag
        //    verloren gehen. In diesem Fall lesen wir den in AsyncStorage
        //    gespiegelten Token und schreiben ihn direkt wieder in den
        //    SecureStore zurück, damit alles wieder synchron ist.
        if (!token) {
          const fallback = await storage.getItem<string | null>(
            TOKEN_FALLBACK_KEY,
            null,
          );
          if (fallback) {
            token = fallback;
            await storage.secureSet(TOKEN_KEY, fallback);
          }
        } else {
          // SecureStore hatte den Token -> Fallback aktuell halten.
          await storage.setItem(TOKEN_FALLBACK_KEY, token);
        }
        // Restore the cached player object FIRST so the user stays logged in
        // even if the network/players list is momentarily unavailable.
        if (savedId && token) {
          const cached = await storage.getItem<string | null>(PLAYER_KEY, null);
          if (cached) {
            try {
              setPlayer(JSON.parse(cached) as Player);
            } catch {
              // ignore malformed cache
            }
          }
        }
        // Then refresh the players list and reconcile the current player.
        try {
          const list = await api.players();
          setPlayers(list);
          if (savedId && token) {
            const found = list.find((p) => p.id === savedId);
            if (found) {
              setPlayer(found);
              await storage.setItem(PLAYER_KEY, JSON.stringify(found));
            }
          }
        } catch {
          // offline: keep the cached player (already set above)
        }
      } catch {
        // ignore, screens handle retries
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = async (p: Player, token: string) => {
    // Token in BEIDE Stores schreiben, damit die Anmeldung ein App-Update
    // garantiert überlebt (siehe Kommentar zu TOKEN_FALLBACK_KEY oben).
    await storage.secureSet(TOKEN_KEY, token);
    await storage.setItem(TOKEN_FALLBACK_KEY, token);
    await storage.setItem(KEY, p.id);
    await storage.setItem(PLAYER_KEY, JSON.stringify(p));
    setPlayer(p);
    registerForPush(p.id);
  };

  const logout = async () => {
    await storage.secureRemove(TOKEN_KEY);
    await storage.removeItem(TOKEN_FALLBACK_KEY);
    await storage.removeItem(KEY);
    await storage.removeItem(PLAYER_KEY);
    setPlayer(null);
  };

  return (
    <Ctx.Provider value={{ ready, player, players, reloadPlayers, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSession = () => useContext(Ctx);
