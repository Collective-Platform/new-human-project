/** Chinese numeral for 1–29 (day and block labels). */
export function toChineseNumeral(n: number): string {
  const ones = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (n <= 9) return ones[n];
  if (n === 10) return "十";
  if (n < 20) return "十" + ones[n % 10];
  if (n === 20) return "二十";
  return "二十" + ones[n % 10];
}
