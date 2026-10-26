export type AbsenceType='temporary'|'vacation';
export type Person = {
 id:string; name:string; area:string; email:string|null; role:string; blocked:boolean;
 user_unknown?:boolean; user_not_found?:boolean; absence_type?:AbsenceType|null;
 return_date?:string|null; deleted_at?:string|null;
};
export type Directory = { people:Person[]; admin:boolean; demo:boolean; migrationRequired?:boolean };
