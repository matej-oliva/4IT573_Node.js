# 2. Zapisování a čtení souborů přes URL

Pomocí url v prohlížeči budeme číst a zapisovat soubory na disku. Do url (za localhost:3000 - pokud mi server běží na portu 3000), můžu napsat budťo `/read/soubor.pripona` nebo `/write/soubor.pripona/obash` . Samozřejmě že soubor.pripona můžu nahradit za libovolný soubor který mám v projektu (main.js, a.txt, ...) a obsah zase za libovolný obsah který chci do souboru zapsat (používejte jen slova bez mezer a speciálních znaku, URL s tím má "problém"). To jak rozdělit URL na název souboru a obsah podle lomítka budete muset vygooglit.

**Příklad:**

`localhost:3000/write/a.txt/a` mi do a.txt souboru zapíše písmeno a
`localhost:3000/read/a.txt` mi v prohlížeči zobrazí obsah souboru a.txt - písmeno a

**Ztížení za extra bod:**

Cesta k souboru může obsahovat lomítka reprezentující adresáře a speciální znaky
`/write/public/users/franta.txt/Franta Sádlo`
Bude teda potřeba zjisti kde končí cesta k souboru a kde začíná název souboru a z kódovaného URL (na serveru mi místo mezery v req.url přijde %20) udělat původní obsah.
