import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DrawResult {
  drawNumber: number;
  date: string;
  numbers: number[];
}

export default function Index() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<DrawResult[]>([]);
  const { toast } = useToast();

  const startParsing = async () => {
    setIsLoading(true);
    setProgress(0);
    setResults([]);

    try {
      const response = await fetch('https://functions.poehali.dev/c7064f76-e7ac-4b9f-8d0c-50d663670a04', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Ошибка парсинга');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              
              if (data.progress !== undefined) {
                setProgress(data.progress);
              }
              
              if (data.result) {
                setResults(prev => [...prev, data.result]);
              }
              
              if (data.complete) {
                toast({
                  title: "Парсинг завершён",
                  description: `Извлечено ${data.total} тиражей`,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось получить данные с сервера",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'keno-archive.json';
    link.click();
  };

  const exportCSV = () => {
    const headers = ['Тираж', 'Дата', 'Числа'];
    const rows = results.map(r => [
      r.drawNumber,
      r.date,
      r.numbers.join(' ')
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const dataBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'keno-archive.csv';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Парсер Столото Кено
          </h1>
          <p className="text-lg text-slate-600">
            Извлечение архивов всех тиражей лотереи Кено
          </p>
        </div>

        <Card className="p-8 mb-8 shadow-lg animate-scale-in">
          <div className="flex flex-col items-center gap-6">
            <Button
              onClick={startParsing}
              disabled={isLoading}
              size="lg"
              className="w-full max-w-md h-14 text-lg font-semibold"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" className="animate-spin mr-2" size={20} />
                  Парсинг в процессе...
                </>
              ) : (
                <>
                  <Icon name="Download" className="mr-2" size={20} />
                  Начать парсинг
                </>
              )}
            </Button>

            {isLoading && (
              <div className="w-full max-w-md animate-fade-in">
                <Progress value={progress} className="h-3" />
                <p className="text-center mt-2 text-sm text-slate-600">
                  {progress}% завершено
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="flex gap-4 animate-fade-in">
                <Button
                  onClick={exportJSON}
                  variant="outline"
                  className="gap-2"
                >
                  <Icon name="FileJson" size={18} />
                  Экспорт JSON
                </Button>
                <Button
                  onClick={exportCSV}
                  variant="outline"
                  className="gap-2"
                >
                  <Icon name="FileSpreadsheet" size={18} />
                  Экспорт CSV
                </Button>
              </div>
            )}
          </div>
        </Card>

        {results.length > 0 && (
          <Card className="p-6 shadow-lg animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Результаты парсинга
              </h2>
              <div className="text-sm text-slate-600">
                Всего тиражей: <span className="font-semibold text-primary">{results.length}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">№ Тиража</TableHead>
                    <TableHead className="font-semibold">Дата</TableHead>
                    <TableHead className="font-semibold">Выпавшие числа</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.slice(0, 50).map((result, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50">
                      <TableCell className="font-medium">
                        {result.drawNumber}
                      </TableCell>
                      <TableCell>{result.date}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {result.numbers.map((num, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-xs font-semibold"
                            >
                              {num}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {results.length > 50 && (
                <p className="text-center text-sm text-slate-500 mt-4">
                  Показано 50 из {results.length} тиражей. Используйте экспорт для полного списка.
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}