export const MATCH_TIME_LIMIT = 480;
export const CONCURRENCY = 4;
export const DEFAULT_CHECK_PROGRESS_INTERVAL = 5 * 60 * 1000;
export const DEFAULT_CRAWL_CHECK_PROGRESS_INTERVAL = 15 * 60 * 1000;
export const COOLDOWN = 30 * 60 * 1000;
export const COOLDOWN_LONG = 60 * 60 * 1000;
export const COOLDOWN_MULTIPLIER = 3; // 3 hours from now
export const PRODUCT_LIMIT = 10000;
export const DANGLING_LOOKUP_THRESHOLD = 20;
export const DANGLING_MATCH_THRESHOLD = 0;
export const MATCH_LOOKUP_THRESHOLD = 0.8;
export const SMALL_LOCKED_PRODUCT_CNT_THRESHOLD = 10;
export const CRAWL_THRESHOLD = 0.9;
export const MAX_TASK_RETRIES = 3;
export const COMPLETE_FAILURE_THRESHOLD = 50;
export const SAVEGUARD_INCREASE_PAGE_LIMIT_RUNAWAY_THRESHOLD = 50;
export const DEFAULT_MAX_TASK_RETRIES = 3;
export const MAX_EARNING_MARGIN = 150;
export const NEW_TASK_CHECK_INTERVAL = 10000;

export const proxyAuth = {
  host: "127.0.0.1:8080",
  username: "",
  password: "",
};

/*
000-019	GS1 US-Präfix
02	GS1 US interne Nummerierungen
20-29	Interne Nummerierungen
221	wird u.a. von ALDI Süd als interne Nummer verwendet
290	wird u.a von ALDI Nord als interne Nummer verwendet
030-039	GS1 US-Präfix
04	GS1 US interne Nummerierungen
05	GS1 US Coupons
060-099	GS1 US-Präfix
100-139	GS1 US-Präfix
140-199	Reserve
300-969*	GS1 Präfixe
970–976	Reserve
977	Zeitschriften (ISSN)
978-979	Bücher und gedruckte Noten (ISBN)
980	Rückgabebons
981-984	Gutscheine in einem gemeinsamen Währungsraum
985-989	Reserve für zukünftige Gutscheinidentifikation
99	Gutscheine
00-09	Velocity Codes
97-99	Reserve
30-37	GS1 Frankreich
380	GS1 Bulgarien
383	GS1 Slowenien
385	GS1 Kroatien
387	GS1 Bosnien-Herzegowina
389	GS1 Montenegro
400-440	GS1 Deutschland
45 + 49	GS1 Japan
46	GS1 Russland
470	GS1 Kirgisistan
471	GS1 Taiwan
474	GS1 Estland
475	GS1 Lettland
476	GS1 Aserbaidschan
477	GS1 Litauen
478	GS1 Usbekistan
479	GS1 Sri Lanka
480	GS1 Philippinen
481	GS1 Belarus
482	GS1 Ukraine
484	GS1 Moldawien
485	GS1 Armenien
486	GS1 Georgien
487	GS1 Kasachstan
488	GS1 Tadschikistan
489	GS1 Hongkong
50	GS1 Großbritannien
520	GS1 Griechenland
528	GS1 Libanon
529	GS1 Zypern
530	GS1 Albanien
531	GS1 Mazedonien
535	GS1 Malta
539	GS1 Irland
54	GS1 Belgien & Luxemburg
560	GS1 Portugal
569	GS1 Island
57	GS1 Dänemark
590	GS1 Polen
594	GS1 Rumänien
599	GS1 Ungarn
600-601	GS1 Südafrika
603	GS1 Ghana
608	GS1 Bahrain
609	GS1 Mauritius
611	GS1 Marokko
613	GS1 Algerien
615	GS1 Nigeria
616	GS1 Kenia
618	GS1 Elfenbeinküste
619	GS1 Tunesien
621	GS1 Syrien
622	GS1 Ägypten
624	GS1 Libyen
625	GS1 Jordanien
626	GS1 Iran
627	GS1 Kuwait
628	GS1 SaudiArabien
629	GS1 Vereinigte Arabische Emirate
64	GS1 Finnland
690-695	GS1 China
70	GS1 Norwegen
729	GS1 Israel
73	GS1 Schweden
740	GS1 Guatemala
741	GS1 El Salvador
742	GS1 Honduras
743	GS1 Nicaragua
744	GS1 Costa Rica
745	GS1 Panama
746	GS1 Dominikanische Republik
750	GS1 Mexiko
754-755	GS1 Canada
759	GS1 Venezuela
76	GS1 Schweiz
770	GS1 Kolumbien
773	GS1 Uruguay
775	GS1 Peru
777	GS1 Bolivien
779	GS1 Argentinien
780	GS1 Chile
784	GS1 Paraguay
786	GS1 Ecuador
789-790	GS1 Brasilien
80-83	GS1 Italien
84	GS1 Spanien
850	GS1 Kuba
858	GS1 Slowakei
859	GS1 Tschechien
860	GS1 Serbien
865	GS1 Mongolei
867	GS1 Nord-Korea
868-869	GS1 Türkei
87	GS1 Niederlande
880	GS1 Südkorea
884	GS1 Kambodscha
885	GS1 Thailand
888	GS1 Singapur
890	GS1 Indien
893	GS1 Vietnam
896	GS1 Pakistan
899	GS1 Indonesien
90-91	GS1 Österreich
93	GS1 Australien
94	GS1 Neuseeland
950	GS1 Global Office
955	GS1 Malaysia
958	GS1 Makao
*/
