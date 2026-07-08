"use client";

import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Icon } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

export function Footer() {
  const [showAd, setShowAd] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [adWatched, setAdWatched] = useState(false);

  return (
    <footer className="mt-auto border-t border-border/50 pb-20 md:pb-0">
      {/* Support section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700/50 p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Left: Logo */}
            <div className="w-full md:w-1/3 flex justify-center">
              <div className="overflow-hidden rounded-lg">
                <img src="/logo.png" alt="METFLIX" className="w-full h-auto object-contain" />
              </div>
            </div>
            {/* Right: Text */}
            <div className="w-full md:w-2/3 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <Icon name="heart" className="h-5 w-5 text-red-500" />
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  Vous êtes chez vous
                </h3>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2 max-w-lg mx-auto md:mx-0 leading-relaxed">
                Les interruptions finissent par gâcher les meilleurs moments.
              </p>
              
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-5 max-w-lg mx-auto md:mx-0 leading-relaxed">
                Ici, <span className="text-zinc-900 dark:text-zinc-100 font-medium">rien ne s&apos;interpose.</span> Vous choisissez, vous regardez, vous gardez le contrôle.
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 max-w-md mx-auto md:mx-0">
                Si un jour vous voulez nous soutenir, c&apos;est <span className="text-red-500 font-medium">vous</span> qui décidez quand et comment.
              </p>
              <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold btn-glow h-12 px-6">
                  <Icon name="server" className="h-4 w-4 mr-2" /> Participer au maintien des serveurs
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAd(true)}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-medium h-12 px-6"
                >
                  <Icon name="heart" className="h-4 w-4 mr-2" /> Meilleur : offrir 30s de mon temps
                </Button>
              </div>
          {showAd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 rounded-lg border border-border/50 bg-card/50 p-4"
            >
              {!adWatched ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-foreground font-medium">🫶 Vous êtes génial, merci !</p>
                  <p className="text-xs text-muted-foreground">La pub s&apos;affiche ci-dessous — 30 secondes et c&apos;est bon :</p>
                  <div className="w-full max-w-sm h-24 rounded-lg bg-muted/50 border border-dashed border-border flex items-center justify-center">
                    <span className="text-xs text-muted-foreground/50">Espace publicitaire</span>
                  </div>
                  <Button size="sm" onClick={() => { setAdWatched(true); setShowAd(false); }}
                    className="bg-green-600 hover:bg-green-700 text-white">
                    <Icon name="check" className="h-3.5 w-3.5 mr-1" /> C&apos;est fait, merci !
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-green-400 flex items-center justify-center gap-1.5">
                  <Icon name="heart" className="h-4 w-4" /> Vous venez de faire la différence. Merci d&apos;être là.
                </p>
              )}
            </motion.div>
          )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer links */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="h-7 w-20 overflow-hidden rounded-md">
            <img src="/logo.png" alt="METFLIX" className="w-full h-full object-cover object-center opacity-60" />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button
              onClick={() => setShowLegal(true)}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Informations Légales
            </button>
            <span>Contact</span>
            <span>DMCA</span>
            <span>Conditions d&apos;utilisation</span>
          </div>
          <p className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} METFLIX. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Legal Information Modal */}
      <Dialog open={showLegal} onOpenChange={setShowLegal}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <Icon name="shield" className="h-5 w-5 text-zinc-500" />
              Informations Légales
            </DialogTitle>
            <DialogDescription className="sr-only">
              Mentions légales et politique de METFLIX
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Content Discovery */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                Plateforme de découverte
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                METFLIX fonctionne comme une plateforme de découverte et d&apos;indexation de contenu.
              </p>
            </div>

            <Separator className="bg-zinc-200 dark:bg-zinc-800" />

            {/* No Hosting */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                Politique de non-hébergement
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                METFLIX fonctionne strictement comme un moteur de recherche et agrégateur qui indexe du contenu
                publiquement disponible sur internet. Nous ne téléchargeons, n&apos;hébergeons et ne stockons
                aucun fichier média.
              </p>
            </div>

            <Separator className="bg-zinc-200 dark:bg-zinc-800" />

            {/* Content Removal */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                Retrait de contenu
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Toutes les demandes de retrait doivent être soumises aux plateformes d&apos;hébergement
                d&apos;origine. Une fois supprimé de ces plateformes, le contenu disparaîtra automatiquement
                de notre index.
              </p>
            </div>

            <Separator className="bg-zinc-200 dark:bg-zinc-800" />

            {/* Disclaimer */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                Avertissement
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Les utilisateurs sont seuls responsables de leurs interactions avec les services tiers
                accessibles via cette plateforme.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}