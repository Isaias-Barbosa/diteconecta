export type Person = { id:string; name:string; area:string; email:string|null; role:string; blocked:boolean };
export type Directory = { people:Person[]; admin:boolean; demo:boolean };
