/* =====================================================================
   FAMILIELEDEN ZONDER KW
   Mensen die bij de familie horen maar geen plaats in de kwartierstaat hebben: de kinderen van Harrie en Alies
   (d1–d3), de broer en zus van Harrie (d4–d5) en de broer en zussen van Alies (d6–d8). In de lijsten kids en sibs
   staat een verwijzing als "Marit · d1".
   { id: "d<N>", n, roep, living: true, father, mother }
   father en mother: het kw van de ouder, "N" in de boom van Harrie, "a-N" in die van Alies.
   Levenden: alleen de voornaam, geen jaartallen, plaatsen of andere gegevens (zie README, Privacy).
   De volgorde van de lijst is de volgorde van de kinderen. De bronnen van de broers en zussen staan bij sibsSrc.
   ===================================================================== */
const DESCENDANTS = [
  { id: "d1", n: "Marit", roep: "Marit", living: true, father: "1", mother: "a-1" },
  { id: "d2", n: "Tijmen", roep: "Tijmen", living: true, father: "1", mother: "a-1" },
  { id: "d3", n: "Jorn", roep: "Jorn", living: true, father: "1", mother: "a-1" },
  { id: "d4", n: "Anneke", roep: "Anneke", living: true, father: "2", mother: "3" },
  { id: "d5", n: "Andre", roep: "Andre", living: true, father: "2", mother: "3" },
  { id: "d6", n: "Hans", roep: "Hans", living: true, father: "a-2", mother: "a-3" },
  { id: "d7", n: "Jikke", roep: "Jikke", living: true, father: "a-2", mother: "a-3" },
  { id: "d8", n: "Anja", roep: "Anja", living: true, father: "a-2", mother: "a-3" }
];
