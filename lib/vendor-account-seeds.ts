export const VENDOR_ACCOUNT_ROWS = `
airwaveajiperkasa-jabo|airwaveajiperkasajabo123|AIRWAVE AJI PERKASA, PT|jabo
airwaveajiperkasa-regional|airwaveajiperkasaregional123|AIRWAVE AJI PERKASA, PT|regional
airi-jabo|airijabo123|Airi|jabo
airi-regional|airiregional123|Airi|regional
andrinateknologiindonesia-jabojabar|andrinateknologiindonesiajabojabar123|ANDRINA TEKNOLOGI INDONESIA, PT|jabojabar
anekajayalanggengsentosa-jabo|anekajayalanggengsentosajabo123|ANEKA JAYA LANGGENG SENTOSA, PT|jabo
anugrahterangpersada-jabojabar|anugrahterangpersadajabojabar123|ANUGRAH TERANG PERSADA, PT|jabojabar
bcm-jabo|bcmjabo123|BCM|jabo
catursekawan-jabojabar|catursekawanjabojabar123|CATUR SEKAWAN, PT|jabojabar
cemerlanglintaspersada-jabo|cemerlanglintaspersadajabo123|CEMERLANG LINTAS PERSADA, PT|jabo
ciptadayaselaras-regional|ciptadayaselarasregional123|CIPTA DAYA SELARAS, PT|regional
dayakomunikasiinternasional-jabojabar|dayakomunikasiinternasionaljabojabar123|DAYA KOMUNIKASI INTERNASIONAL, PT|jabojabar
fajarmitrakridaabadi-regional|fajarmitrakridaabadiregional123|FAJAR MITRA KRIDA ABADI, PT|regional
globalmultipowerindonesia-regional|globalmultipowerindonesiaregional123|GLOBAL MULTIPOWER INDONESIA, PT|regional
jmm-jabo|jmmjabo123|JMM|jabo
jmm-regional|jmmregional123|JMM|regional
jga-regional|jgaregional123|JGA|regional
jip-jabo|jipjabo123|JIP|jabo
jip-regional|jipregional123|JIP|regional
magnaenergiindonusa-regional|magnaenergiindonusaregional123|MAGNA ENERGI INDONUSA, PT|regional
maheswariarthamegah-regional|maheswariarthamegahregional123|MAHESWARI ARTHA MEGAH, PT|regional
mandalaputra-jabojabar|mandalaputrajabojabar123|MANDALA PUTRA, PT|jabojabar
marsakaninabestari-regional|marsakaninabestariregional123|MARSA KANINA BESTARI, PT|regional
melesatprimanusantara-regional|melesatprimanusantararegional123|MELESAT PRIMA NUSANTARA, PT|regional
mitrakreasindosinergitama-jabo|mitrakreasindosinergitamajabo123|MITRA KREASINDO SINERGITAMA, PT|jabo
mitrakreasindosinergitama-regional|mitrakreasindosinergitamaregional123|MITRA KREASINDO SINERGITAMA, PT|regional
naertunasindonesia-regional|naertunasindonesiaregional123|NAER TUNAS INDONESIA, PT|regional
natajayaelektro-jabo|natajayaelektrojabo123|NATA JAYA ELEKTRO, PT|jabo
natajayaelektro-regional|natajayaelektroregional123|NATA JAYA ELEKTRO, PT|regional
nusantarainformateknologi-regional|nusantarainformateknologiregional123|NUSANTARA INFORMA TEKNOLOGI, PT|regional
onara-jabo|onarajabo123|Onara|jabo
pancaranlangit-jabo|pancaranlangitjabo123|PANCARAN LANGIT, PT|jabo
pancaranlangit-regional|pancaranlangitregional123|PANCARAN LANGIT, PT|regional
pilargapuranusa-regional|pilargapuranusaregional123|PILAR GAPURA NUSA, PT|regional
pragatamakmurpersada-regional|pragatamakmurpersadaregional123|PRAGATA MAKMUR PERSADA, PT|regional
richton-regional|richtonregional123|RICHTON, PT|regional
riskiprimasakti-regional|riskiprimasaktiregional123|RISKI PRIMA SAKTI, PT|regional
sabaprimakonstruksi-jabo|sabaprimakonstruksijabo123|SABA PRIMA KONSTRUKSI, PT|jabo
sabaprimakonstruksi-regional|sabaprimakonstruksiregional123|SABA PRIMA KONSTRUKSI, PT|regional
sumbersolusitelkoperkasa-regional|sumbersolusitelkoperkasaregional123|SUMBERSOLUSI TELKO PERKASA, PT|regional
technologykaryamandiri-regional|technologykaryamandiriregional123|TECHNOLOGY KARYA MANDIRI, PT|regional
teknotamaprakarsamulia-regional|teknotamaprakarsamuliaregional123|TEKNOTAMA PRAKARSA MULIA, PT|regional
transdataglobalnetwork-regional|transdataglobalnetworkregional123|TRANSDATA GLOBAL NETWORK, PT|regional
vendorassign-jabojabar|vendorassignjabojabar123|VENDOR ASSIGN|jabojabar
zteindonesia-jabo|zteindonesiajabo123|ZTE INDONESIA, PT|jabo
zteindonesia-regional|zteindonesiaregional123|ZTE INDONESIA, PT|regional
`.trim();

export const VENDOR_SEED_ACCOUNTS = VENDOR_ACCOUNT_ROWS.split("\n").map((row, index) => {
  const [username, password, vendorName, regionScope] = row.split("|");
  return { id: `usr-vendor-${String(index + 10).padStart(3, "0")}`, username, password, name: vendorName, role: "vendor_user" as const, vendorName, regionScope };
});
