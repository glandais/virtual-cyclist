# Migration ledger — PrimeVue 4 → Nuxt UI v4

> **Statut global : `DONE`** — branche `worktree-migrate-nuxt-ui`. **P1–P9 et T1–T18 faits** : plus aucun composant PrimeVue, typecheck + lint + build verts, passe visuelle OK. Points ouverts tranchés et acceptés le 2026-08-17 (§6). Prêt pour merge.
> Décision : remplacer PrimeVue par **Nuxt UI v4** (MIT, bâti sur Tailwind v4 + Reka UI).
> Motif : PrimeVue v5 passe sous licence commerciale.
> Périmètre : `demo/` uniquement — la librairie `src/` n'a aucune dépendance UI.
>
> Légende statut : `TODO` · `WIP` · `DONE` · `BLOCKED` · `SKIP`

> ### 📌 Dépôt jumeau
>
> `~/code/perso/vcyclist/demo` est un portage de cette même démo sur un moteur Kotlin/JS et
> partage **exactement la même surface PrimeVue** (vérifié par diff le 2026-08-17). Son ledger
> — `vcyclist/demo/MIGRATION-NUXT-UI.md` — reprend T1–T13 à l'identique et liste les écarts
> (ESLint au lieu d'oxlint, build Gradle préalable, composant `ClimbsPanel` en plus) en §6.
> **Migrer ce dépôt-ci en premier**, puis y reporter les diffs : la moitié des fichiers touchés
> sont identiques octet pour octet.

---

## 0. État des lieux (relevé le 2026-08-17)

### Composants PrimeVue réellement montés

| Composant                                                    | Occ. vivantes | Fichiers                                                                                |
| ------------------------------------------------------------ | ------------- | --------------------------------------------------------------------------------------- |
| `Button`                                                     | 13            | `Toolbar.vue` (5), `BikeTab.vue` (4), `ConfigModal.vue` (4)                             |
| `SliderInput.vue` _(wrapper local `Slider` + `InputNumber`)_ | **16**        | `CyclistTab` (6), `BikeTab` (5), `PowerTab` (2), `EnhanceOptionsTab` (2), `WindTab` (1) |
| `Checkbox`                                                   | 7             | `EnhanceOptionsTab.vue` (5), `PowerTab.vue` (1), `FieldsSidebar.vue` (1, dans `v-for`)  |
| `Panel`                                                      | 4             | `ConfigModal.vue`, `FileSection.vue`, `BikeTab.vue`, `CyclistTab.vue`                   |
| `Slider` (direct)                                            | 1             | `WindTab.vue` (gradient custom)                                                         |
| `InputNumber` (direct)                                       | 1             | `WindTab.vue`                                                                           |
| `Select`                                                     | 1             | `FileSection.vue`                                                                       |
| `RadioButton`                                                | 3             | `PowerTab.vue` (même groupe `powerSource`)                                              |
| `Drawer`                                                     | 1             | `FieldsSidebar.vue`                                                                     |
| `Accordion` + 3 sous-composants                              | 1             | `FieldsSidebar.vue`                                                                     |
| `Tabs` + 4 sous-composants                                   | 1             | `ConfigModal.vue`                                                                       |
| `Toast` + `useToast()`                                       | 1 + 6 appels  | `App.vue`                                                                               |
| `ProgressSpinner`                                            | 1             | `Toolbar.vue`                                                                           |
| ~~`Dialog`~~                                                 | **0**         | uniquement dans `Modal.vue`, fichier mort                                               |

### Dette identifiée à purger au passage

| Constat                    | Détail                                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **5 fichiers morts**       | `Modal.vue`, `DataPanel.vue`, `FieldsTab.vue`, `VisualizationControls.vue`, `ControlPanel.vue` — zéro import dans tout `src/` |
| **`primeicons` inutilisé** | importé dans `main.css`, **zéro** classe `pi pi-*` dans le code ; toute l'iconographie est en emoji                           |
| **Dark mode mort**         | `darkModeSelector: '.dark'` configuré, rien ne pose jamais la classe `dark`                                                   |
| **`cssLayer: false`**      | le CSS PrimeVue n'est pas dans un `@layer` → conflit frontal avec Tailwind v4, aucun plugin `tailwindcss-primeui` installé    |
| **Imports incohérents**    | `ConfigModal.vue` et `FieldsSidebar.vue` importent depuis le barrel `primevue`, le reste par sous-chemin                      |
| **`vue-router` absent**    | prérequis du plugin Vue standalone de Nuxt UI                                                                                 |

---

## 1. Prérequis — à faire avant toute migration de composant

| #   | Tâche                                                                                                       | Statut | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P1  | Supprimer les 5 fichiers morts (`Modal`, `DataPanel`, `FieldsTab`, `VisualizationControls`, `ControlPanel`) | `DONE` | Fait disparaître `Dialog` du périmètre. Commit séparé, avant tout le reste.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| P2  | Retirer `primeicons` de `package.json` et de `main.css`                                                     | `DONE` | Dépendance morte, indépendante de la migration. Peut être commitée dès maintenant.                                                                                                                                                                                                                                                                                                                                                                                                               |
| P3  | `npm i @nuxt/ui vue-router` · `npm rm primevue @primeuix/themes primeicons`                                 | `DONE` | `vue-router` est requis par `@nuxt/ui/vue-plugin` même sans routes ; créer un router minimal (`createWebHashHistory`, une route `/`).                                                                                                                                                                                                                                                                                                                                                            |
| P4  | `vite.config.ts` : ajouter le plugin `ui()` de `@nuxt/ui/vite` avec `colorMode: false`                      | `DONE` | `colorMode: false` tant que le dark mode n'est pas un objectif — évite de réintroduire du mort. Voir T15 si on le veut.                                                                                                                                                                                                                                                                                                                                                                          |
| P5  | `main.ts` : remplacer `app.use(PrimeVue, {...})` + `app.use(ToastService)` par `app.use(uiPlugin)`          | `DONE` | Supprime le preset Aura et `cssLayer: false`.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| P6  | `App.vue` : envelopper la racine dans `<UApp>`                                                              | `DONE` | Requis pour que `useToast()` / overlays fonctionnent. Remplace `<Toast />`.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| P7  | `main.css` : ajouter `@import "@nuxt/ui";` après `@import "tailwindcss";`                                   | `DONE` | Vérifier l'ordre par rapport à `custom.css` (styles Leaflet/compass).                                                                                                                                                                                                                                                                                                                                                                                                                            |
| P8  | `vite.config.ts` : remplacer les `manualChunks` `primevue1`/`primevue2`/`primeuix`                          | `DONE` | Nouveau split sur `node_modules/@nuxt/ui` + `node_modules/reka-ui`. Garder `leaflet` / `chartjs` inchangés.                                                                                                                                                                                                                                                                                                                                                                                      |
| P9  | **Rétrograder `typescript` en `^6`**                                                                        | `DONE` | **Découverte hors plan.** `npm run typecheck` était **déjà cassé sur `develop`** : `vue-tsc@3.3.9` ne peut pas charger `typescript@7.0.2` (`ERR_PACKAGE_PATH_NOT_EXPORTED`, régression du bump dependabot 8f87f0c). Or `@nuxt/ui@4.10.0` plafonne son peer à `typescript@^5.6.3 \|\| ^6.0.0` — aucune version publiée ne supporte TS 7. Passer en TS 6.0.3 **répare le typecheck** et supprime le besoin de `--legacy-peer-deps`. À rouvrir quand `vue-tsc` **et** `@nuxt/ui` supporteront TS 7. |

**Point de contrôle P** : `npm run typecheck && npm run lint && npm run build` passent avec l'app à moitié cassée visuellement mais Nuxt UI monté. Ne pas enchaîner tant que ce n'est pas vert.

---

## 2. Migration des composants

Ordre imposé par le risque : `SliderInput` d'abord (16 usages en dépendent), les triviaux ensuite, les structurels en dernier.

| #      | Cible                                                      | Effort          | Statut | Détail                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------ | ---------------------------------------------------------- | --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **T1** | **`SliderInput.vue`** → `USlider` + `UInputNumber`         | **Élevé**       | `DONE` | **Composant pivot — à faire et valider en premier.** Vérifier explicitement l'équivalence de : `minFractionDigits`/`maxFractionDigits` (calculés depuis `step` dans `fractionDigits`), `useGrouping: false`, `locale="en-US"`, `suffix` (` ${unit}`). Si `UInputNumber` ne couvre pas `suffix`, le rendre en `<span>` adjacent. Migrer `pt:input:class="text-right w-full"` vers la prop `:ui`.                                                              |
| T2     | `Button` → `UButton`                                       | Faible          | `DONE` | Mapping : `severity="secondary"` → `color="neutral"`, `warn` → `warning`, `primary` → `primary`, `success`/`danger` idem ; `outlined` → `variant="outline"` ; `size="small"` → `size="sm"` ; `:disabled` inchangé. Labels emoji restent en slot par défaut.                                                                                                                                                                                                  |
| T3     | `Checkbox` → `UCheckbox`                                   | Faible          | `DONE` | 7 usages, tous en `:modelValue` + `@update:modelValue` (pilotage externe, pas de `v-model`) — ce pattern est conservé tel quel. `:binary="true"` disparaît (comportement par défaut). `:inputId` → vérifier l'attribut équivalent pour garder les `<label :for>` de `FieldsSidebar`.                                                                                                                                                                         |
| T4     | `Select` → `USelect`                                       | Faible          | `DONE` | `FileSection.vue`. `:options` + `optionLabel`/`optionValue` → prop `items` avec `value-key`/`label-key`. Conserver `placeholder`, `:disabled`, `@update:modelValue` → `onGPXChange`.                                                                                                                                                                                                                                                                         |
| T5     | `ProgressSpinner` → **manuel**                             | Faible          | `DONE` | Aucun spinner circulaire dédié dans Nuxt UI. Remplacer par `<UIcon name="i-lucide-loader-circle" class="animate-spin size-5" />` — **implique d'ajouter une collection d'icônes** (`@iconify-json/lucide`), première icône non-emoji du projet. Alternative sans dépendance : un `<div>` CSS `border` + `animate-spin`. **Trancher avant T5.**                                                                                                               |
| T6     | `RadioButton` ×3 → `URadioGroup`                           | Moyen           | `DONE` | `PowerTab.vue` : pas de radio unitaire dans Nuxt UI. Les 3 radios sont déjà un seul groupe (`name="powerSource"`) → passer à un `URadioGroup` piloté par un tableau `items` `[{value, label, description}]`. **La mise en forme actuelle (carte cliquable `<label>` avec bordure, hover, titre gras + description) doit être reconstruite via les slots du composant** — c'est là que part l'effort, pas dans la logique.                                    |
| T7     | `Panel` ×4 → `UCollapsible` (+ `UCard`)                    | **Moyen-élevé** | `DONE` | Pas d'équivalent 1:1. Deux profils distincts : (a) `BikeTab` / `CyclistTab` / `FileSection` = `toggleable :collapsed="true"` + `#header` → `UCollapsible` avec slot `#default` en trigger ; (b) `ConfigModal` = **non toggleable**, simple conteneur titré → un `UCard` (ou du markup Tailwind nu) suffit. Migrer les `pt:root:class` / `pt:header:class` / `pt:content:class` (bleus de `FileSection` et `ConfigModal`) vers `:ui` ou des classes directes. |
| T8     | `Tabs` (+`TabList`/`Tab`/`TabPanels`/`TabPanel`) → `UTabs` | Moyen           | `DONE` | `ConfigModal.vue` : 5 onglets → API `items` array `[{label: '👤 Cyclist', slot: 'cyclist'}, ...]` avec un `<template #cyclist>` par onglet hébergeant le composant enfant. Refactor structurel, pas un renommage. Corrige au passage l'import barrel incohérent.                                                                                                                                                                                             |
| T9     | `Accordion` (+3 sous-composants) → `UAccordion`            | Moyen           | `DONE` | `FieldsSidebar.vue` : `v-for` sur `fieldConfig` → construire un `computed` `items` `[{label: category.name, slot: categoryKey}]`. `multiple` → prop `type="multiple"`. `:value="Object.keys(fieldConfig)"` (tout ouvert par défaut) → `default-value` avec le même tableau. Le contenu (liste de `UCheckbox` + labels) passe dans les slots dynamiques.                                                                                                      |
| T10    | `Drawer` → `UDrawer` (ou `USlideover`)                     | Faible-moyen    | `DONE` | `FieldsSidebar.vue` : `position="right"` → `direction="right"`. `header="📊 Chart Fields"` → slot `#header`. `class="!w-48/100"` (48 % de largeur, `!` pour battre la spécificité PrimeVue) → à réécrire proprement via `:ui`, le `!important` ne devrait plus être nécessaire. **Vérifier que `USlideover` n'est pas le meilleur choix** pour un panneau latéral persistant.                                                                                |
| T11    | `Toast` + `useToast()` → `UToast` + `useToast()`           | Faible          | `DONE` | `App.vue`, 6 appels. Renommage de champs : `severity: 'success'` → `color: 'success'` (et `'error'` → `'error'`), `summary` → `title`, `detail` → `description`, `life` → `duration`. `<Toast />` supprimé au profit de `<UApp>` (voir P6).                                                                                                                                                                                                                  |
| T12    | `Slider` direct de `WindTab.vue` → `USlider`               | Moyen           | `DONE` | Le gradient `pt:root:class="bg-gradient-to-r from-blue-500 via-green-500 to-blue-500"` doit passer par `:ui` (slot `track`) ou du CSS ciblé dans `custom.css`. Attention au handler existant `Array.isArray($event) ? $event[0] : $event` — vérifier le type émis par `USlider` (range vs valeur simple).                                                                                                                                                    |
| T13    | `InputNumber` direct de `WindTab.vue` → `UInputNumber`     | Faible          | `DONE` | `suffix="°"`, `:min="0" :max="360" :step="15"`, `class="w-20"`. Dépend des constats de T1.                                                                                                                                                                                                                                                                                                                                                                   |

---

## 3. Finalisation

| #   | Tâche                                                                                                               | Statut | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T14 | Purge finale : plus aucune occurrence de `primevue`, `@primeuix`, `primeicons`, `pt:` dans `src/` et `package.json` | `DONE` | `grep -rn "primevue\|primeuix\|primeicons\|pt:" src/ package.json` doit rendre vide.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| T15 | _(optionnel)_ Activer réellement le dark mode                                                                       | `SKIP` | Nuxt UI le fournit gratuitement via `colorMode: true` + `useColorMode()`. À décider explicitement — aujourd'hui c'est du mort chez PrimeVue. Ne pas l'ouvrir dans le même chantier.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| T16 | Vérifier le poids du bundle avec un analyzer                                                                        | `DONE` | **Régression mesurée et acceptée — voir §6.1.** Mesures `npm run build` :<br>• **Avant (PrimeVue)** : JS 544,0 kB (**120,8 kB gzip**) + CSS 18,7 kB (4,5 kB gzip) = **125,3 kB gzip**<br>• **Après (Nuxt UI)** : JS 569,9 kB (**168,9 kB gzip**) + CSS 197,2 kB (25,8 kB gzip) = **194,6 kB gzip**<br>**+69,3 kB gzip, soit +55 %.** Le CSS passe de 18,7 à 197,2 kB brut (×10,5) : Tailwind ne purge pas la feuille de Nuxt UI. C'est exactement le risque anticipé (issue nuxt/ui#3376). Point tranché le 2026-08-17 : **accepté** au regard du bénéfice de licence. Pistes d'optimisation ultérieures en §6.1. |
| T17 | `npm run check:demo` vert (typecheck + oxlint + build)                                                              | `DONE` |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| T18 | Passe visuelle manuelle sur les 5 onglets, le drawer, le toast, la carte et le graphe                               | `DONE` | Vérifier surtout que Leaflet et Chart.js (`custom.css`, `.leaflet-map`, `.compass`) ne sont pas régressés par le changement de couche CSS.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

---

## 4. Risques

| Risque                                                                                      | Gravité               | Mitigation                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SliderInput.vue` ne trouve pas d'équivalence exacte (`fractionDigits`, `suffix`, `locale`) | **Haute** — 16 usages | Le migrer **en premier** (T1) et valider avant tout autre composant. Si `UInputNumber` est insuffisant, envisager un `<input type="number">` natif stylé Tailwind plutôt que de tordre le composant. |
| Bundle plus lourd qu'avec PrimeVue                                                          | Moyenne               | T16 avant de merger. Si rédhibitoire, repli sur Reka UI seul (2ᵉ choix technique, mais tout le style à écrire).                                                                                      |
| `Panel` et `RadioButton` demandent une vraie recomposition, pas un renommage                | Moyenne               | Budgéter T6 et T7 comme les deux plus gros postes après T1.                                                                                                                                          |
| Régression CSS sur Leaflet / compass / graphe                                               | Moyenne               | Le passage de `cssLayer: false` à une intégration Tailwind native change l'ordre des couches — T18 est obligatoire, pas cosmétique.                                                                  |
| Écosystème Nuxt UI centré Nuxt                                                              | Faible                | Le chemin Vue standalone est officiellement documenté et supporté, mais les exemples de la doc resteront majoritairement Nuxt.                                                                       |

---

## 5. Découpage en commits suggéré

1. `chore(demo): remove dead components` — P1
2. `chore(demo): drop unused primeicons dependency` — P2
3. `build(demo): install nuxt ui alongside primevue` — P3, P4, P5, P6, P7 _(point de contrôle P)_
4. `refactor(demo): migrate SliderInput to Nuxt UI` — T1 _(le commit à valider le plus soigneusement)_
5. `refactor(demo): migrate simple form controls` — T2, T3, T4, T5, T11
6. `refactor(demo): migrate PowerTab radio group` — T6
7. `refactor(demo): migrate Panel usages` — T7
8. `refactor(demo): migrate Tabs, Accordion and Drawer` — T8, T9, T10
9. `refactor(demo): migrate WindTab slider and input` — T12, T13
10. `build(demo): drop primevue dependencies and rechunk bundle` — P8, T14, T16

---

## 6. Points tranchés

La migration fonctionnelle est terminée (T1–T14 faits, typecheck + lint + build verts, passe
visuelle OK sur les 5 onglets, le drawer, la carte et le graphe).

> **Décision (2026-08-17) : les quatre points ci-dessous sont acceptés en l'état.** La migration
> est validée pour merge. Le surpoids de bundle (§6.1) est assumé au regard du bénéfice de
> licence ; les pistes d'optimisation restent notées comme travail ultérieur facultatif, pas
> comme condition de merge.

### 6.1 Poids du bundle — accepté

|                  | JS gzip  | CSS gzip | **Total gzip**       |
| ---------------- | -------- | -------- | -------------------- |
| PrimeVue (avant) | 120,8 kB | 4,5 kB   | **125,3 kB**         |
| Nuxt UI (après)  | 168,9 kB | 25,8 kB  | **194,6 kB**         |
| Delta            | +48,1 kB | +21,3 kB | **+69,3 kB (+55 %)** |

Le CSS brut passe de 18,7 kB à 197,2 kB (×10,5) : la feuille de Nuxt UI n'est pas purgée par
Tailwind. **Accepté en l'état pour une démo.** Pistes d'optimisation ultérieures, par ordre de
rendement attendu (facultatives, hors périmètre de cette PR) :

1. Vérifier la configuration `@source` de Tailwind v4 vis-à-vis de `node_modules/@nuxt/ui`.
2. Restreindre les composants générés par le plugin `ui()` à ceux réellement utilisés.
3. Analyser `nuxtui` avec un bundle analyzer : confirmer si Tiptap / Embla / Tanstack entrent
   dans le chunk (issue nuxt/ui#3376) ou si les 569 kB sont bien du Reka UI utile.
4. Si rien ne suffit : arbitrer explicitement +69 kB gzip contre le bénéfice de licence, ou
   rouvrir le dossier Reka UI seul (2ᵉ choix de l'évaluation).

### 6.2 Dépendance runtime à `api.iconify.design` — résolu, à ne pas régresser

Nuxt UI récupérait ses icônes (`check`, `chevron-down`, `plus`, `minus`) **depuis l'API Iconify
au runtime** — vérifié dans l'onglet réseau. La démo aurait cassé hors ligne ou derrière un
pare-feu, là où PrimeVue n'avait aucune dépendance externe (icônes en emoji). Corrigé en
installant `@iconify-json/lucide` en devDependency : après redémarrage du serveur, plus aucun
appel sortant. **Ne pas retirer cette dépendance.**

### 6.3 Fichiers générés commités — exclus d'oxfmt

`components.d.ts` et `auto-imports.d.ts` sont générés par le plugin `ui()` et **commités**, car
`npm run typecheck` (`vue-tsc --noEmit`) tourne sans passer par Vite et ne les régénérerait pas.
Contrepartie : ils changent à chaque ajout ou retrait de composant. Alternative si le bruit gêne :
les gitignorer et faire précéder le typecheck d'un build.

Ils sont ajoutés aux `ignorePatterns` de `.oxfmtrc.json` : le plugin les réécrit à **chaque**
build dans un format qu'oxfmt rejette, si bien que `npm run format:check` repassait au rouge
juste après un `npm run build`. Les formater n'aurait donc rien réglé de durable.

### 6.4 Écarts visuels assumés

- Le suffixe d'unité (`W`, `m/s`, `kg⋅m²`…) est désormais **à côté** du champ, plus dedans :
  `Intl.NumberFormat` n'accepte que sa propre liste d'unités, qui n'en couvre aucune ici.
- `ProgressSpinner` est remplacé par un spinner CSS (`border` + `animate-spin`) : Nuxt UI n'a pas
  de spinner circulaire et une seule occurrence ne justifiait pas d'icône dédiée.
- Les `Panel` togglables deviennent des `UCollapsible` avec un chevron texte (`▲`/`▼`).
- `UDrawer` est forcé en `:modal="false"` : ouvert par défaut, il rendait sinon le graphe
  inutilisable derrière son overlay, ce que le `Drawer` PrimeVue ne faisait pas.

---

## 7. Références

- Installation Vue standalone : <https://ui.nuxt.com/docs/getting-started/installation/vue>
- Catalogue de composants : <https://ui.nuxt.com/components>
- `URadioGroup` : <https://ui.nuxt.com/docs/components/radio-group>
- `UToast` / `useToast()` : <https://ui.nuxt.com/docs/components/toast>
- Annonce v4 (fusion core + Pro, MIT) : <https://nuxt.com/blog/nuxt-ui-v4>
- Tree-shaking `reka-ui` : <https://github.com/nuxt/ui/issues/3376>
- Licence PrimeVue v5 : <https://primeui.dev/nextchapter> · <https://primevue.dev/migration/v5/>
