console.log("Is NaN valid Date:", isNaN(new Date()));
console.log("Is NaN Invalid Date:", isNaN(new Date("invalid")));
console.log("Is NaN string timestamp:", isNaN(new Date("1704067200000")));
console.log("Is NaN number timestamp:", isNaN(new Date(1704067200000)));
console.log("Empty string:", isNaN(new Date("")));
console.log("Undefined:", isNaN(new Date(undefined)));
