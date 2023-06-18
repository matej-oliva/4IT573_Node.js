# Login

Zdravím. Posílám zadání dalšího úkolu. Pokud chcete, můžete vycházet z mé verze aplikace na GitHubu: [node-todos-2023](https://github.com/adamjedlicka/node-todos-2023)

Opět posílám dva úkoly, jednodušší a težší. Každý úkol opět za 3 body.

Jednodušší úkol: Implementujte a otestujte přihlašování a odhlašování uživatelů. Na přihlášení bude potřeba nový formulář, na odhlášení bude stačit odkaz/tlačítko odhlásit se.

Těžší úkol: Přihlášený uživatel si bude vytvářet svoje todočka. Tyto todočka budou na výpisu vidět pouze pro daného přihlášeného uživatele. Stejně tak detail těchto todoček bude vidět pouze pokud jsem přihlášen jako uživatel, který dané todočko vytvářel. V DB toto navázání realizujte pomocí cizího klíče v tabulce todos, který se odkazuje na záznam z tabulky users (nebo bude obsahovat null pokud se jedná o todočko anonymního uživatele). Za testy dám 2 body navíc.
