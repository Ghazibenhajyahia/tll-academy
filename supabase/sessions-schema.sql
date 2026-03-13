-- ============================================================
-- Sessions & Questions tables (run AFTER schema.sql)
-- ============================================================

-- Relax session_index constraint to allow more than 4 sessions
ALTER TABLE session_results DROP CONSTRAINT IF EXISTS session_results_session_index_check;
ALTER TABLE session_results ADD CONSTRAINT session_results_session_index_check CHECK (session_index >= 0);

-- Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id serial PRIMARY KEY,
  sort_order int NOT NULL DEFAULT 0,
  label text NOT NULL,
  title text NOT NULL,
  chapters text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id serial PRIMARY KEY,
  session_id int NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  context text NOT NULL DEFAULT '',
  text text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  correct int NOT NULL DEFAULT 0,
  explanation text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Everyone can read (needed for quiz)
CREATE POLICY "Anyone reads sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Anyone reads questions" ON public.questions FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admin inserts sessions" ON public.sessions FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin updates sessions" ON public.sessions FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin deletes sessions" ON public.sessions FOR DELETE USING (public.is_admin());

CREATE POLICY "Admin inserts questions" ON public.questions FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin updates questions" ON public.questions FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin deletes questions" ON public.questions FOR DELETE USING (public.is_admin());

-- ============================================================
-- Seed data (4 sessions, 48 questions)
-- ============================================================

INSERT INTO public.sessions (sort_order, label, title, chapters) VALUES
(0, 'Session 1 · Chapitres 1–8', 'Opérations Fondamentales', 'Ch.01 Philosophie · Ch.02 Structure · Ch.03 Rôles · Ch.04 Check-in · Ch.05 Check-out · Ch.06 Ménage · Ch.07 Annonce · Ch.08 Visibilité'),
(1, 'Session 2 · Chapitres 9–15', 'Relation Client & Outils', 'Ch.09 Convaincre · Ch.10 Fidéliser · Ch.11 Avis · Ch.12 TLL Manager · Ch.13 Checklists · Ch.14 FAQ Crise · Ch.15 Ressources'),
(2, 'Session 3 · Chapitres 16–22', 'Finance & Équipe', 'Ch.16 ROI · Ch.17 Fiscal · Ch.18 Onboarding · Ch.19 Flux Financier · Ch.20 Booking · Ch.21 Saisonnalité · Ch.22 Équipe'),
(3, 'Session 4 · Chapitres 23–29', 'Terrain, Finance & Droit', 'Ch.23 Fiscalité · Ch.24 Paiement · Ch.25 Dégâts · Ch.26 Cautions · Ch.27 Assurances · Ch.28 Incidents · Ch.29 Propriétaires difficiles');

-- Session 1 questions (session_id = 1)
INSERT INTO public.questions (session_id, sort_order, context, text, options, correct, explanation) VALUES
(1, 0, 'Chapitre 01 — Philosophie & Vision', 'En quelle année The Landlord a-t-elle été fondée, et avec combien de logements ?', '["En 2021 avec 5 logements","En 2019 avec 1 logement","En 2020 avec 3 logements","En 2018 avec 10 logements"]', 1, 'The Landlord a été fondée en 2019 à Tunis avec un seul appartement par Farouk et Sarah Ben Achour.'),
(1, 1, 'Chapitre 01 — Philosophie & Vision', 'Quelle est la redevance réseau TLL appliquée aux franchisés ?', '["5% du GMV brut","10% des revenus nets","3% du GMV brut","2% du chiffre d''affaires"]', 2, 'La redevance réseau TLL est de 3%, parmi les plus basses du marché franchise international.'),
(1, 2, 'Chapitre 02 — Structure Opérationnelle', 'À partir de combien de logements faut-il recruter un support client dédié 24/7 ?', '["Dès le 1er logement","À partir de 5 logements","À partir de 8 logements","À partir de 15 logements"]', 2, 'Selon le modèle de délégation progressive TLL, le support client 24/7 dédié est requis à partir de 8 logements.'),
(1, 3, 'Chapitre 03 — Rôles & Responsabilités', 'Quel outil centralise la coordination de toutes les opérations quotidiennes dans une conciergerie TLL ?', '["WhatsApp Business","Google Sheets","TLL Manager (TLM)","Airbnb Pro"]', 2, 'TLL Manager (TLM) est la colonne vertébrale opérationnelle : planning, CRM, comptabilité, qualité, Channel Manager.'),
(1, 4, 'Chapitre 03 — Rôles & Responsabilités', 'Quand le rapport mensuel propriétaire est-il généré et envoyé automatiquement ?', '["Le 5 du mois","Le 1er du mois","Le 10 du mois","Le 15 du mois"]', 1, 'TLL Manager génère automatiquement le rapport mensuel le 1er du mois et l''envoie par email au propriétaire.'),
(1, 5, 'Chapitre 04 — Le Check-in Parfait', 'Combien de temps avant l''arrivée le code SmartLock temporaire doit-il être envoyé au voyageur ?', '["12h avant l''arrivée","24h avant l''arrivée","2h avant l''arrivée","1 semaine avant"]', 2, 'Le code SmartLock est configuré et envoyé 2h avant l''arrivée du voyageur pour le check-in autonome.'),
(1, 6, 'Chapitre 04 — Le Check-in Parfait', 'Quel message TLM est envoyé à J-3 avant l''arrivée du voyageur ?', '["Code SmartLock et instructions d''accès","Message de bienvenue automatique — infos arrivée","Rappel de l''heure de check-out","Lien pour laisser un avis"]', 1, 'À J-3, TLL Manager envoie automatiquement le message de bienvenue avec les informations d''arrivée par Email + SMS.'),
(1, 7, 'Chapitre 05 — Le Check-out Contrôlé', 'Combien de relances d''avis maximum sont autorisées après le départ du voyageur ?', '["Aucune limite","3 relances maximum","2 relances espacées d''une semaine","Une seule relance douce à J+3"]', 3, 'TLL applique une seule relance douce à J+3 si aucun avis n''a été laissé.'),
(1, 8, 'Chapitre 06 — Le Ménage 5 Étoiles', 'Combien de photos minimum doivent être prises dans TLM après chaque ménage pour validation ?', '["5 photos","10 photos minimum","20 photos","Pas de nombre défini"]', 1, 'Le protocole TLL exige 10 photos minimum dans TLM lors de l''étape de validation post-ménage.'),
(1, 9, 'Chapitre 07 — Créer & Optimiser une Annonce', 'Quel est le prix de lancement recommandé pour un nouveau logement lors de ses 3 premières semaines ?', '["Prix standard sans réduction","-10% pendant 1 semaine","-20% pendant 3 premières semaines","-30% pendant 1 mois"]', 2, 'TLL recommande un prix de lancement à -20% les 3 premières semaines pour générer les premières réservations et avis.'),
(1, 10, 'Chapitre 08 — Multiplier sa Visibilité', 'Quelle est la commission d''Airbnb et celle de TheLandlord.tn sur les réservations ?', '["Airbnb 10% / TheLandlord.tn 5%","Airbnb 15% / TheLandlord.tn 0%","Airbnb 17% / TheLandlord.tn 3%","Airbnb 12% / TheLandlord.tn 8%"]', 1, 'Airbnb prélève 15% de commission. TheLandlord.tn est à 0% de commission.'),
(1, 11, 'Chapitre 08 — Multiplier sa Visibilité', 'Quelle fonctionnalité de TLL Manager synchronise automatiquement calendriers et prix sur toutes les plateformes ?', '["Module CRM","Channel Manager","Module Comptabilité","Module Qualité"]', 1, 'Le Channel Manager de TLL Manager synchronise les calendriers et prix en temps réel sur toutes les plateformes.');

-- Session 2 questions (session_id = 2)
INSERT INTO public.questions (session_id, sort_order, context, text, options, correct, explanation) VALUES
(2, 0, 'Chapitre 09 — Convaincre un Propriétaire', 'Un propriétaire dit : « Je peux gérer mon logement moi-même sur Airbnb ». Quelle est la réponse TLL ?', '["Reconnaître que c''est vrai","Nos propriétaires génèrent en moyenne 40% de revenus supplémentaires grâce au pricing dynamique, photos pro et gestion 24/7","Proposer une commission réduite","Lui montrer uniquement les avis"]', 1, 'La réponse officielle TLL : nos propriétaires génèrent en moyenne 40% de revenus supplémentaires.'),
(2, 1, 'Chapitre 09 — Convaincre un Propriétaire', 'Quelle couverture d''assurance protège le propriétaire contre les dégâts causés par les voyageurs ?', '["Uniquement l''assurance personnelle","Caution + Comar (15 000 DT/sinistre) + AirCover Airbnb jusqu''à 3M€","Seulement AirCover Airbnb","La plateforme couvre tout"]', 1, 'Triple protection TLL : caution + assurance Comar exclusive (15 000 DT/sinistre) + AirCover Airbnb jusqu''à 3M€.'),
(2, 2, 'Chapitre 10 — Fidéliser les Voyageurs', 'Quel est le budget recommandé pour la petite attention à l''arrivée (dattes, eau, fleurs) selon TLL ?', '["15–20 TND","5–8 TND","20–30 TND","Aucun budget fixe"]', 1, 'TLL recommande un budget de 5 à 8 TND pour la petite attention à l''arrivée. ROI maximal.'),
(2, 3, 'Chapitre 10 — Fidéliser les Voyageurs', 'Quel message automatique TLM est envoyé à M+3 après le séjour ?', '["Rappel de laisser un avis","Relance saisonnière : ''L''été approche — votre appartement favori est disponible''","Offre de parrainage","Aucun message après J+24"]', 1, 'À M+3, TLM envoie une relance saisonnière automatique aux voyageurs ayant séjourné l''année précédente.'),
(2, 4, 'Chapitre 11 — Gestion des Avis', 'Dans quel délai maximum faut-il répondre à un avis négatif ?', '["Dans les 24h","Dans les 48h","Dans la semaine","Sans délai imposé"]', 1, 'TLL impose une réponse systématique à tout avis négatif dans les 48 heures.'),
(2, 5, 'Chapitre 11 — Gestion des Avis', 'Quelle augmentation de taux d''occupation en passant de 4.7 à 4.9 étoiles sur Airbnb ?', '["5%","10%","20%","30%"]', 2, 'Passer de 4.7 à 4.9 sur Airbnb peut augmenter le taux d''occupation de 20% selon le manuel TLL.'),
(2, 6, 'Chapitre 12 — TLL Manager', 'Combien de modules principaux compose TLL Manager ?', '["4 modules","5 modules","6 modules","8 modules"]', 2, 'TLL Manager est composé de 6 modules principaux.'),
(2, 7, 'Chapitre 13 — Checklists Opérationnelles', 'Avant quel jour du mois les reversements propriétaires doivent-ils être effectués ?', '["Avant le 5","Avant le 10","Avant le 15","Avant le 28"]', 1, 'Les reversements propriétaires doivent être effectués avant le 10 du mois.'),
(2, 8, 'Chapitre 14 — FAQ & Scénarios de Crise', 'Un voyageur demande un early check-in. Que dit le protocole TLL si le logement est libre ?', '["Toujours refuser","Gratuit pour voyageur fidèle / 30% du prix de la nuit précédente pour nouveau voyageur","Facturer 50% du prix de la nuit","Le proposer uniquement si la rotation est terminée"]', 1, 'Si disponible : gratuit pour voyageur fidèle, ou 30% du prix de la nuit précédente pour un nouveau voyageur.'),
(2, 9, 'Chapitre 14 — FAQ & Scénarios de Crise', 'Si le WiFi ne fonctionne pas, quel est le délai d''intervention selon le protocole TLL ?', '["Dans les 24h","Dans les 4h","Dans les 2h ou compensation data mobile","À la prochaine maintenance"]', 2, 'Technicien dans les 2h ou compensation data mobile si le problème persiste.'),
(2, 10, 'Chapitre 15 — Messages Automatiques', 'Quel canal est utilisé pour le message de confirmation de réservation TLL ?', '["WhatsApp uniquement","SMS uniquement","Plateforme + Email","Email + WhatsApp"]', 2, 'Le message de confirmation est envoyé via la Plateforme (Airbnb/Booking) et par Email.'),
(2, 11, 'Chapitre 15 — Messages Automatiques', 'Dans le message 48h avant check-in, quelle URL le voyageur reçoit-il ?', '["checkin.airbnb.com","app.thelandlord.tn","www.checkin.thelandlord.tn","guest.tllmanager.com"]', 2, 'Le voyageur effectue son check-in sur www.checkin.thelandlord.tn avec son code de confirmation.');

-- Session 3 questions (session_id = 3)
INSERT INTO public.questions (session_id, sort_order, context, text, options, correct, explanation) VALUES
(3, 0, 'Chapitre 16 — Modèle Économique & ROI', 'À partir de combien de logements un franchisé TLL atteint-il le seuil de rentabilité ?', '["2 logements","5 logements bien optimisés","10 logements","20 logements"]', 1, 'Avec 5 logements bien optimisés, un franchisé couvre ses charges fixes et atteint l''équilibre.'),
(3, 1, 'Chapitre 16 — Modèle Économique & ROI', 'Quel est le pourcentage de commission de gestion TLL sur le GMV brut HT ?', '["10–15%","20–25%","25–30%","15–20%"]', 1, 'La commission de gestion TLL est de 20 à 25% du GMV brut HT.'),
(3, 2, 'Chapitre 17 — Cadre Légal & Fiscal', 'Avant quel jour du mois doit être effectuée la déclaration TEJ ?', '["Avant le 28","Avant le 10","Avant le 5","Avant le 15"]', 2, 'La déclaration TEJ doit être effectuée avant le 5 de chaque mois pour le mois précédent.'),
(3, 3, 'Chapitre 17 — Cadre Légal & Fiscal', 'Quel est le taux de Retenue à la Source (RS) appliqué sur les loyers nets ?', '["5%","15%","19%","10%"]', 3, 'La RS sur les loyers est de 10% appliquée sur le loyer net reversé au propriétaire.'),
(3, 4, 'Chapitre 17 — Cadre Légal & Fiscal', 'Revenus bruts 3 000 TND — quel est le montant du virement net au propriétaire ?', '["2 080 TND","2 340 TND","1 872 TND","2 500 TND"]', 2, '3 000 - 660 - 125 - 135 = 2 080 - 208 (RS 10%) = 1 872 TND de virement net propriétaire.'),
(3, 5, 'Chapitre 18 — Onboarding du Franchisé', 'Quelle est la première action prioritaire du Jour 1 dans le plan d''onboarding franchisé TLL ?', '["Signer le premier contrat propriétaire","Accès TLM configuré + formation initiale 4h avec référent TLL","Publier les annonces sur Airbnb","Recruter un agent de ménage"]', 1, 'Jour 1 : accès TLL Manager configuré + formation initiale de 4 heures avec un référent TLL.'),
(3, 6, 'Chapitre 19 — Flux Financier', 'Quel est le taux de TVA appliqué sur la commission du franchisé en Tunisie ?', '["7%","13%","19%","10%"]', 2, 'La TVA appliquée sur la commission du franchisé TLL est de 19%.'),
(3, 7, 'Chapitre 19 — Flux Financier', 'À quelle étape du cycle financier TLM génère-t-il automatiquement le relevé mensuel ?', '["Le 5 du mois","Le 10 du mois","Le 1er du mois (clôture mensuelle)","Le 28 du mois"]', 2, 'Clôture mensuelle le 1er du mois — TLM génère le relevé complet et l''envoie automatiquement au propriétaire.'),
(3, 8, 'Chapitre 20 — Optimisation Booking.com', 'Pour quel type de logement recommande-t-on la confirmation manuelle sur Booking.com ?', '["Tous les logements","Uniquement les standards en basse saison","Logements haut de gamme (>300 TND/nuit), séjours longue durée, haute saison","Uniquement lors des 2 premières semaines"]', 2, 'Confirmation manuelle recommandée pour les logements >300 TND/nuit, séjours >7 nuits, haute saison.'),
(3, 9, 'Chapitre 20 — Optimisation Booking.com', 'Quel est l''objectif de taux de réponse pour un bon score Booking.com ?', '["Supérieur à 70%","Supérieur à 85%","Supérieur à 95%","100% obligatoire"]', 2, 'L''objectif TLL sur Booking.com est un taux de réponse supérieur à 95%.'),
(3, 10, 'Chapitre 21 — Gestion de la Saisonnalité', 'Quel multiplicateur de prix TLL recommande-t-il en haute saison (Juillet–Septembre) ?', '["× 1.0","× 1.1 – 1.2","× 1.4 – 1.8","× 2.0 – 2.5"]', 2, 'En haute saison, TLL recommande un multiplicateur de × 1.4 à × 1.8.'),
(3, 11, 'Chapitre 22 — Recruter & Former son Équipe', 'Quelle est la durée du briefing de formation d''un agent de ménage sur le protocole TLL 45 étapes ?', '["30 minutes","1h","2h","Demi-journée complète"]', 2, 'La formation agent de ménage sur le protocole TLL 45 étapes dure 2 heures.');

-- Session 4 questions (session_id = 4)
INSERT INTO public.questions (session_id, sort_order, context, text, options, correct, explanation) VALUES
(4, 0, 'Chapitre 23 — Fiscalité', 'Quel est le taux d''IS applicable aux PME en Tunisie selon le manuel TLL ?', '["10%","15%","25%","19%"]', 1, 'L''IS pour les PME en Tunisie est de 15%. Le statut recommandé pour le franchisé est la SUARL.'),
(4, 1, 'Chapitre 23 — Fiscalité', 'Quel statut juridique TLL recommande-t-il pour un franchisé tunisien débutant ?', '["SARL (capital min. 1 000 TND)","SUARL (capital min. recommandé 5 000 TND)","Personne physique indépendante","Société anonyme (SA)"]', 1, 'TLL recommande le statut SUARL avec un capital minimum recommandé de 5 000 TND.'),
(4, 2, 'Chapitre 23 — Fiscalité', 'Quel est le taux de cotisation CNSS total (employeur + salarié) en Tunisie ?', '["16,57% total","25,75% total (16,57% employeur + 9,18% salarié)","20% total","30% total"]', 1, 'CNSS Tunisie : 25,75% au total — 16,57% employeur + 9,18% salarié.'),
(4, 3, 'Chapitre 24 — Paiement Propriétaire', 'Sur Booking.com, quel est le délai maximum accordé au voyageur pour payer après réception du lien ?', '["48h","72h","24h","1 semaine"]', 2, 'Après envoi du lien de paiement Booking.com, le voyageur dispose de 24h maximum pour régler.'),
(4, 4, 'Chapitre 25 — Gestion des Dégâts Locatifs', 'Sur Airbnb, dans quel délai maximum doit-on activer AirCover après le check-out ?', '["7 jours","10 jours","14 jours","30 jours"]', 2, 'AirCover doit être activé dans les 14 jours suivant le check-out.'),
(4, 5, 'Chapitre 25 — Gestion des Dégâts Locatifs', 'Quelle est la première étape du protocole dégât TLL après la constatation du sinistre ?', '["Contacter immédiatement le voyageur par SMS","Réparer avant la prochaine rotation","Photos horodatées TLM, ne pas toucher ni réparer, notifier via messagerie plateforme","Appeler directement Comar"]', 2, 'Étape J+0 : photos horodatées dans TLM, ne pas toucher ni réparer, notifier via messagerie de la plateforme.'),
(4, 6, 'Chapitre 26 — Cautions & Dépôts', 'Comment Airbnb gère-t-il les cautions voyageurs selon le protocole TLL ?', '["Airbnb prélève une caution fixe de 500€","Airbnb ne prélève pas de caution réelle — en cas de dégât, contacter le voyageur puis activer AirCover","Airbnb prélève la caution définie par l''hôte automatiquement","Airbnb rembourse automatiquement le propriétaire"]', 1, 'Airbnb ne prélève pas de caution réelle. En cas de dégât : contacter d''abord le voyageur, puis activer AirCover si refus.'),
(4, 7, 'Chapitre 27 — Assurances MRP Comar', 'Quelle est la prime annuelle TTC de l''Assurance MRP Comar pour The Landlord ?', '["250 DT / an","350 DT / an","348,080 DT / an","500 DT / an"]', 2, 'La prime annuelle TTC de l''Assurance MRP Comar négociée par The Landlord est de 348,080 DT.'),
(4, 8, 'Chapitre 27 — Assurances MRP Comar', 'Quel est le capital assuré pour la RC (dommages corporels) dans l''offre Comar TLL ?', '["100 000 DT","500 000 DT","1 000 000 DT","15 000 DT"]', 2, 'La garantie RC Comar couvre les dommages corporels jusqu''à 1 000 000 DT.'),
(4, 9, 'Chapitre 28 — Incidents Terrain', 'Quel est le délai d''intervention requis pour un incident URGENT (fuite d''eau, coupure électrique totale) ?', '["4 heures","2 heures","30 minutes","Immédiat"]', 2, 'Les incidents urgents requièrent une intervention dans les 30 minutes avec notification immédiate.'),
(4, 10, 'Chapitre 28 — Incidents Terrain', 'Quels numéros d''urgence nationaux composer en cas d''incident critique en Tunisie ?', '["15 / 16 / 17","198 / 199 / 200","190 / 197 / 198","100 / 101 / 102"]', 2, 'En Tunisie : 190 (police), 197 (garde nationale), 198 (pompiers/protection civile).'),
(4, 11, 'Chapitre 29 — Propriétaires Difficiles', 'Après combien d''heures le franchisé doit-il obligatoirement informer le réseau TLL d''un conflit propriétaire non résolu ?', '["Après 12h","Après 24h","Après 48h","Après 1 semaine"]', 2, 'Règle d''or TLL : ne jamais gérer un conflit propriétaire seul au-delà de 48h sans en informer le réseau TLL.');
