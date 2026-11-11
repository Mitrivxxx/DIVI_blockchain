
ocenic architektore arontendu, moze vertical slice ertical Slice: Dzieli aplikację na bardzo wąskie funkcje/funkcjonalności (Use Cases)
Modularnego Monolitu jako nadrzędnej struktury (katalogów wysokiego poziomu), a wewnątrz nich – zastosowanie Vertical Slice dla konkretnych akcji.


Werdykt: Od czego zacząć?

Wdróż Modularny Monolit. Zdefiniuj 4 do 6 głównych obszarów Twojej aplikacji (np. auth, dashboard, billing, users).
Dopiero wewnątrz tych obszarów stwórz katalog features/ i tam zastosuj zasadę Vertical Slice. W ten sposób w żadnym miejscu aplikacji nie będziesz mieć więcej niż kilka folderów obok siebie, a Twój kod będzie niesamowicie łatwy w utrzymaniu.

-------------------------
1. focused dotnet test tests/backend.Tests --filter "FullyQualifiedName~Document"
2. backend regressiondotnet test tests/backend.Tests
3. cross layer backendu, frontendu i blockchaina,
4. full project

---

testy smart contract

4. Testy End-to-End (E2E) / UI Tests (Playwright)
Co to jest: Testy, które uruchamiają prawdziwą przeglądarkę (np. Chrome headless przez Playwright lub Cypress) i klikają po interfejsie Reacta.
Scenariusz w DIVI:
Bot wchodzi na stronę localhost:3000.
Podłącza testowy portfel (np. wtyczkę MetaMask przez Synpress/Playwright).
Przeciąga plik PDF do formularza uploadu.
Klika „Wydaj dokument”.
Przechodzi do zakładki weryfikacji i sprawdza, czy widzi zieloną tarczę poświadczenia


8. Testy mutacyjne (Mutation Testing)(jak bedzie czas)
Narzędzie: Stryker.NET.
Co to jest: "Testowanie testów". Narzędzie celowo psuje Twój kod produkcyjny (np. zamienia == na !=, usuwa warunek if, zwraca null).
Cel: Sprawdzenie, czy Twoje testy to zauważą (czy test zczerwienieje). Jeśli zepsujesz logikę w FollowService, a wszystkie testy wciąż przechodzą na zielono – oznacza to, że testy były pozorne (false sense of security).