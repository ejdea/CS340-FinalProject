using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;

namespace ImportStockCSVToMySQL
{
    class Program
    {
        static void Main(string[] args)
        {
            string modified_text = string.Empty;

            using (StreamReader sr = new StreamReader(@"C:\Git\OSU\CS340-FinalProject\db\SPY.csv"))
            {
                while (sr.Peek() > -1)
                {
                    bool OHLC = false;
                    string prefix = string.Empty;
                    string input = string.Empty;

                    if (OHLC)
                    {
                        prefix = "INSERT INTO `fp_price`(`stock_id`, `timestamp`, `open`, `high`, `low`, `close`) VALUES (";
                    }
                    else
                    {
                        prefix = "INSERT INTO `fp_price`(`stock_id`, `timestamp`, `price`) VALUES (";
                    }
                    const string postfix = ");";

                    String text = sr.ReadLine();

                    string[] tokens = text.Split(new char[1] { ',' });
                    string[] date = tokens[0].Split(new char[1] { '/' });
                    string month = date[0];
                    string day = date[1];
                    string year = date[2];

                    if (OHLC)
                    {
                        input = "1,'" + year + "-" + month + "-" + day + "'," + tokens[1] + "," + tokens[2] + "," + tokens[3] + "," + tokens[4];
                    }
                    else
                    {
                        input = "1,'" + year + "-" + month + "-" + day + " 06:30:00'," + tokens[1];
                    }

                    text = prefix + input + postfix + Environment.NewLine;
                    Console.WriteLine(text);

                    modified_text += text;
                }

                using (StreamWriter sw = new StreamWriter(@"C:\Git\OSU\CS340-FinalProject\db\SPY_SQL.csv"))
                {
                    sw.Write(modified_text);
                }
            }
        }
    }
}
