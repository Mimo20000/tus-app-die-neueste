import React, { createContext, useContext, useEffect, useState } from "react";
import { storage } from "@/src/utils/storage";
import { api, Player } from "@/src/api";
import { registerForPush } from "@/src/push";

const KEY = "tus.currentPlayerId";
const TOKEN_KEY = "tus.token";
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
        const token = await storage.secureGet<string | null>(TOKEN_KEY, null);
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
    await storage.secureSet(TOKEN_KEY, token);
    await storage.setItem(KEY, p.id);
    await storage.setItem(PLAYER_KEY, JSON.stringify(p));
    setPlayer(p);
    registerForPush(p.id);
  };

  const logout = async () => {
    await storage.secureRemove(TOKEN_KEY);
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
