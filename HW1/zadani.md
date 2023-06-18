# 1. Kopírování souborů

Zadáním příkazu `node main.mjs zdroj.txt cil.txt` budu chtít zkopírovat obsah souboru `zdroj.txt` do souboru `cil.txt` . Pokud zadám pouze jeden soubor nebo žádný, program mě o tom informuje a nic nikam kopírovat nebude - `node main.mjs zdroj.txt` nebo `node main.mjs` vypíše info o nedostatečném počtu argumentů. Samozřejmostí je, že názvy zdrojových a cílových se mohou měnit (`node main.mjs main.mjs kopie.mjs`)

Program může mít dále spoustu kontrol. Co když zdrojový soubor neexistuje? Co když cílový soubor již existuje a není prázdný? Co když je prázdný? Co když cílový soubor se nachází uvnitř adresáře, který zatím neexistuje (`node main.mjs zdroj.txt slozka/druha/cil.txt`). Zda tyto otázky budete řešit a jak nechám na vás. Lepší/složitější/kreativnější řešení obdrží více bodů.

**Rada na závěr** jak získat názvy souborů při spouštění scriptu: Node.js má proměnnou `process.argv` . Jedná se o pole obsahující všechny parametry použité při spouštění scriptu. Doporučuji `console.log(process.argv)` a podívat se co mi Node.js vypíše například u příkazu `node main.mjs zdroj.txt cil.txt` .
