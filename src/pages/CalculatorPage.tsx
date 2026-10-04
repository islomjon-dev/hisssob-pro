import { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { t } from '../i18n';
import { Delete } from 'lucide-react';

export default function CalculatorPage() {
  const { settings } = useSettingsStore();
  const lang = settings?.language || 'uz';
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);

  function handleNumber(num: string) {
    if (resetNext) {
      setDisplay(num);
      setResetNext(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  }

  function handleDecimal() {
    if (resetNext) {
      setDisplay('0.');
      setResetNext(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }

  function handleOperation(op: string) {
    const current = parseFloat(display);
    if (prevValue !== null && operation && !resetNext) {
      const result = calculate(prevValue, current, operation);
      setDisplay(String(result));
      setPrevValue(result);
    } else {
      setPrevValue(current);
    }
    setOperation(op);
    setResetNext(true);
  }

  function calculate(a: number, b: number, op: string): number {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  }

  function handleEquals() {
    if (prevValue === null || !operation) return;
    const current = parseFloat(display);
    const result = calculate(prevValue, current, operation);
    setDisplay(String(parseFloat(result.toFixed(10))));
    setPrevValue(null);
    setOperation(null);
    setResetNext(true);
  }

  function handleClear() {
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setResetNext(false);
  }

  function handleDelete() {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  }

  function handlePercent() {
    const current = parseFloat(display);
    setDisplay(String(current / 100));
  }

  const buttons = [
    { label: 'C', action: handleClear, className: 'bg-gray-200 text-gray-700 hover:bg-gray-300' },
    { label: '±', action: () => setDisplay(String(parseFloat(display) * -1)), className: 'bg-gray-200 text-gray-700 hover:bg-gray-300' },
    { label: '%', action: handlePercent, className: 'bg-gray-200 text-gray-700 hover:bg-gray-300' },
    { label: '÷', action: () => handleOperation('÷'), className: 'bg-blue-500 text-white hover:bg-blue-600' },
    { label: '7', action: () => handleNumber('7'), className: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200' },
    { label: '8', action: () => handleNumber('8'), className: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200' },
    { label: '9', action: () => handleNumber('9'), className: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200' },
    { label: '×', action: () => handleOperation('×'), className: 'bg-blue-500 text-white hover:bg-blue-600' },
    { label: '4', action: () => handleNumber('4'), className: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200' },
    { label: '5', action: () => handleNumber('5'), className: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200' },
    { label: '6', action: () => handleNumber('6'), className: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200' },
    { label: '-', action: () => handleOperation('-'), className: 'bg-blue-500 text-white hover:bg-blue-600' },
    { label: '1', action: () => handleNumber('1'), className: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200' },
    { label: '2', action: () => handleNumber('2'), className: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200' },
    { label: '3', action: () => handleNumber('3'), className: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200' },
    { label: '+', action: () => handleOperation('+'), className: 'bg-blue-500 text-white hover:bg-blue-600' },
    { label: '⌫', action: handleDelete, className: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200' },
    { label: '0', action: () => handleNumber('0'), className: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200' },
    { label: '.', action: handleDecimal, className: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200' },
    { label: '=', action: handleEquals, className: 'bg-green-500 text-white hover:bg-green-600' },
  ];

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('calc.title', lang)}</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        {/* Display */}
        <div className="bg-gray-900 rounded-xl p-6 mb-4">
          <p className="text-right text-3xl font-mono text-white truncate">
            {parseFloat(display).toLocaleString('uz-UZ', { maximumFractionDigits: 10 })}
          </p>
          {operation && prevValue !== null && (
            <p className="text-right text-sm text-gray-400 mt-1">
              {prevValue} {operation}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((btn, i) => (
            <button
              key={i}
              onClick={btn.action}
              className={`py-4 rounded-xl text-lg font-medium transition-colors active:scale-95 ${btn.className}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
