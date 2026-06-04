// generowanie spis treści: rozszerzenie `Markdown All in One` w VSCode, ctr+shift+p --> create table of contents. ctr+s też działa!
- [1. Przechowywanie danych](#1-przechowywanie-danych)
  - [1.1 Ceny instrumentów](#11-ceny-instrumentów)
    - [Pytanie, jak się liczy dzień dla akcji w różnych krajach, po prostu UTC? Bedzie sie zgadzało z danymi z innych miejsc?](#pytanie-jak-się-liczy-dzień-dla-akcji-w-różnych-krajach-po-prostu-utc-bedzie-sie-zgadzało-z-danymi-z-innych-miejsc)
  - [1.2 Użytkownicy i ich transakcje](#12-użytkownicy-i-ich-transakcje)
- [2. Zbieranie danych](#2-zbieranie-danych)
  - [2.1 Ceny instrumentów](#21-ceny-instrumentów)
  - [2.2 Ceny krypto](#22-ceny-krypto)
    - [TO DO](#to-do)
- [3. Podatek](#3-podatek)
- [4. Logowanie, nie potrzebne dopóki przechowywujemy dane usera lokalnie](#4-logowanie-nie-potrzebne-dopóki-przechowywujemy-dane-usera-lokalnie)
- [5. Notatki i tier lista spółek, w przyszłości, współdzielenie?](#5-notatki-i-tier-lista-spółek-w-przyszłości-współdzielenie)
- [Słownik](#słownik)

TO DO
-Exchange tez jako enum? przeniesc mapping enumów do projektu importera ze stooq?
-Zapisać dane historyczne (ceny).
-Pathy zawierające C:\\Users\\sxz04011... fajnie by bylo moc ustawic naraz wszystkie na jakis konkretny folder.
...



# 1. Przechowywanie danych 
## 1.1 Ceny instrumentów
Na ten moment pliki, wychodzą najłatwiej i najtaniej
Folder `database`:
  -  `availableTickers.txt` - plik z wszytskimi wspieranymi tickerami, zawiera dwie kolumny, `ticker` oraz `instrumentId`.
  -  `instruments`:
    - `basicInfo`:
      - `<INSTRUMENT_ID>.txt` - plik z podstawowymi informacjami o danym instrumencie, zawiera kolumny `instrumentId`, `ticker`, `name`, `country`, `exchange`, `type`.
    - `details`:
      - `<INSTRUMENT_ID>.txt` - plik z szczegółowymi informacjami o danym instrumencie, zawiera kolumny `instrumentId`, `ticker`, `name`, `country`, `shortDescription`, `longDescription`, `categories` i wiele więcej.
  - `dailyPriceHistory` - w przyszłości podział na lata (że foldery 2025, 2026...), na ten moment niepotrzebne:
  ### Pytanie, jak się liczy dzień dla akcji w różnych krajach, po prostu UTC? Bedzie sie zgadzało z danymi z innych miejsc?
    - `perInstrument`:
      - `<INSTRUMENT_ID>_<TICKER>.txt` - plik z cenami (na ten moment na kazdy dzień, może kiedyś będą częstsze). Kolumny: `date` (YYYYMMDD), `endPrice`, `maxPrice`, `minPrice`, `startPrice`.
    - `perDay`:
      - `<DATE_YYYYMMDD>.txt` - plik z cenami wszystkich instrumentów z danego dnia. Kolumny: `instrumentId`, `ticker`(dla ludzi, program nie używa), `endPrice`, `maxPrice`, `minPrice`, `startPrice`.
  - `otherData.txt` - plik z małymi danymi potrzebnymi do działania aplikacji. Wiersze:
    - `<date_YYYYMMDDhhmmss>` - ostatnia data dla której pobrane są ceny dla instrumentów.
    - `<date_YYYYMMDDhhmmss>` - ostatnia data dla której pobrane są ceny dla instrumentów, ale krypto.
## 1.2 Użytkownicy i ich transakcje
Chcemy przechowywać to lokalnie, ale w przyszłości opcja żeby przechowywać to zdalnie dla chętnych. Lokalnie znaczy ze wczytujemy plik do pamięci przeglądarki? Przeglądarka moze zapisywać lokalnie pliki a nie w pamięci? Na telefonie zadziała?

# 2. Zbieranie danych
## 2.0 DB Migrations
`dotnet tool install --global dotnet-ef --version 9.0.16 --verbosity diag --ignore-failed-sources`
`dotnet ef migrations add <migration_name>`
## 2.1 Ceny instrumentów
Dane pobieramy z `https://stooq.com/db/`. `https://stooq.com/db/h` - dane historyczne.
Projekt StockHistoryImporter --> Stooq --> DataImporter
Wymagania:
  - System plików do zapisu pobranych danych, więc np odpalanie w lambdzie odpada.
  - Playwright - for windows worked `npx playwright install`.
  - Python - skrypt czytający captcha. Paczki: numpy, easyocr. Nie uda się w lambdzie.
  - Browser path, używamy realnej przeglądarki żeby nas nie blokowało.
## 2.2 Ceny krypto
### TO DO
Dane pobieramy z `https://api.coinmarketcap.com/data-api/v3.1/cryptocurrency/historical?id=1027&timeStart=1648771200&interval=1d&convertId=2781`.
Projekt StockHistoryImporter --> CryptoPageName --> DataImporter
var cryptoList = await new CoinListImporter().Get500CoinsList();

# 3. Podatek
- podatek od np dywidend osobno niz podatek od akcji
- podatek wyliczamy od zamknietych pozycji (zamknecia zawieraja zysk wiec otwarcia nas nie obchodzą)

# 4. Logowanie, nie potrzebne dopóki przechowywujemy dane usera lokalnie

# 5. Notatki i tier lista spółek, w przyszłości, współdzielenie? 

# Słownik
- instrument / trade instrument - firma/waluta/kryptowaluta np. Microsoft, Bitcoin, USD
- ticker - skrót dla danego instrumentu giełdowego, np NVDA dla NVIDI.
- wspierany ticker - ticker dla którego cena jest pobierana i przechowywana przez system.
- trade - pojedyncza transakcja
- current trade/position - obecnie otwarta pozycja na danym instrumencie
- long - pozycja 'normalna' czyli kupno po x i potem sprzedaz po y
- short - pozycja 'na spadki' czyli 'pożyczasz' instrument od giełdy z obowiązkiem zwrotu takiej samej ilosci, pożyczasz x akcji po Y, płacisz za nie i oddajesz później x akcji po Z

