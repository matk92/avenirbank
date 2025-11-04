const COUNTRY_CODE = "FR";
const BANK_CODE = "30004";
const BRANCH_CODE = "01234";

function mod97(value: string): number {
  let remainder = 0;
  for (const char of value) {
    const digit = Number(char);
    remainder = (remainder * 10 + digit) % 97;
  }
  return remainder;
}

function convertToNumeric(iban: string): string {
  return iban
    .toUpperCase()
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return (code - 55).toString();
      }
      return char;
    })
    .join("");
}

export function generateIban(seed: number): string {
  const accountNumber = (Math.abs(seed) % 1_000_000_000_000)
    .toString()
    .padStart(11, "0");
  const accountKey = ((Math.abs(seed) % 97) + 1).toString().padStart(2, "0");
  const bban = `${BANK_CODE}${BRANCH_CODE}${accountNumber}${accountKey}`;
  const rearranged = `${bban}${COUNTRY_CODE}00`;
  const numericRepresentation = convertToNumeric(rearranged);
  const remainder = mod97(numericRepresentation);
  const checkDigits = (98 - remainder).toString().padStart(2, "0");
  return `${COUNTRY_CODE}${checkDigits}${bban}`;
}
