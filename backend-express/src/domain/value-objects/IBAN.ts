export class IBAN {
  private constructor(private readonly value: string) {}

  public static create(value: string): IBAN {
    if (!IBAN.isValid(value)) {
      throw new Error('Invalid IBAN format');
    }
    return new IBAN(value);
  }

  public static generate(): IBAN {
    // Generate French IBAN: FR + 2 check digits + 5 bank code + 5 branch code + 11 account number
    const bankCode = '30004'; // Standard bank code for AVENIR
    const branchCode = Math.random().toString().slice(2, 7).padStart(5, '0');
    const accountNumber = Math.random().toString().slice(2, 13).padStart(11, '0');
    
    const bban = bankCode + branchCode + accountNumber;
    const checkDigits = IBAN.calculateCheckDigits('FR', bban);
    
    const iban = `FR${checkDigits}${bban}`;
    return new IBAN(iban);
  }

  public static isValid(iban: string): boolean {
    // Remove spaces and convert to uppercase
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    
    // Check format: FR + 2 digits + 23 alphanumeric characters
    if (!/^FR\d{25}$/.test(cleanIban)) {
      return false;
    }

    // Validate checksum using mod-97
    return IBAN.validateChecksum(cleanIban);
  }

  private static calculateCheckDigits(countryCode: string, bban: string): string {
    // Move country code and check digits to end, replace letters with numbers
    const rearranged = bban + IBAN.replaceLetters(countryCode) + '00';
    const remainder = IBAN.mod97(rearranged);
    const checkDigits = 98 - remainder;
    return checkDigits.toString().padStart(2, '0');
  }

  private static validateChecksum(iban: string): boolean {
    // Move first 4 characters to end
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    // Replace letters with numbers
    const numericString = IBAN.replaceLetters(rearranged);
    // Calculate mod 97
    return IBAN.mod97(numericString) === 1;
  }

  private static replaceLetters(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => {
      return (letter.charCodeAt(0) - 55).toString();
    });
  }

  private static mod97(numericString: string): number {
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
      remainder = (remainder * 10 + parseInt(numericString[i]!, 10)) % 97;
    }
    return remainder;
  }

  public getValue(): string {
    return this.value;
  }

  public getFormattedValue(): string {
    // Format as FR76 3000 4000 0100 0001 2345 678
    return this.value.replace(/(.{4})/g, '$1 ').trim();
  }

  public equals(other: IBAN): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
