/**
 * IBAN Value Object - Domain Layer
 * Encapsulates IBAN generation and validation logic
 * 
 * IBAN Format: FR + 2 check digits + 5 bank code + 5 branch code + 11 account number
 * Example: FR1420041010050500013M02606
 */

export class IBAN {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Generate a new valid IBAN for France
   * Bank code: 20041 (example)
   * Branch code: 01005 (example)
   * Account number: generated from timestamp + random
   */
  static generate(): IBAN {
    const bankCode = '20041';
    const branchCode = '01005';
    
    // Generate account number (11 digits)
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    const accountNumber = (timestamp + random).slice(-11);

    // Calculate check digits
    const ibanWithoutCheck = `FR00${bankCode}${branchCode}${accountNumber}`;
    const checkDigits = IBAN.calculateCheckDigits(ibanWithoutCheck);

    const iban = `FR${checkDigits}${bankCode}${branchCode}${accountNumber}`;
    return new IBAN(iban);
  }

  /**
   * Create IBAN from string (with validation)
   */
  static fromString(value: string): IBAN {
    const sanitized = value.toUpperCase().replace(/\s/g, '');
    
    if (!IBAN.isValid(sanitized)) {
      throw new Error(`Invalid IBAN: ${value}`);
    }

    return new IBAN(sanitized);
  }

  /**
   * Validate IBAN using mod-97 algorithm
   */
  private static isValid(iban: string): boolean {
    // Check format
    if (!/^FR\d{2}\d{23}$/.test(iban)) {
      return false;
    }

    // Validate check digits using mod-97
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    const numeric = rearranged
      .split('')
      .map((char) => {
        const code = char.charCodeAt(0);
        return code >= 65 && code <= 90 ? (code - 55).toString() : char;
      })
      .join('');

    return IBAN.mod97(numeric) === 1;
  }

  /**
   * Calculate check digits for IBAN
   */
  private static calculateCheckDigits(ibanWithoutCheck: string): string {
    const rearranged = ibanWithoutCheck.slice(4) + ibanWithoutCheck.slice(0, 4);
    const numeric = rearranged
      .split('')
      .map((char) => {
        const code = char.charCodeAt(0);
        return code >= 65 && code <= 90 ? (code - 55).toString() : char;
      })
      .join('');

    const remainder = IBAN.mod97(numeric);
    const checkDigits = (98 - remainder).toString().padStart(2, '0');
    return checkDigits;
  }

  /**
   * Calculate mod-97 for IBAN validation
   */
  private static mod97(numeric: string): number {
    let remainder = 0;
    for (const digit of numeric) {
      remainder = (remainder * 10 + parseInt(digit, 10)) % 97;
    }
    return remainder;
  }

  /**
   * Get IBAN value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Format IBAN with spaces (for display)
   */
  format(): string {
    return this.value.match(/.{1,4}/g)?.join(' ') || this.value;
  }

  /**
   * Compare two IBANs
   */
  equals(other: IBAN): boolean {
    return this.value === other.value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value;
  }
}
