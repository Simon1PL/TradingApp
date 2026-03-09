namespace StockHistoryImporter.Python;

using global::Python.Runtime;

internal static class TextFromImageReader
{
    public static string ReadTextFromImage(byte[] imageBytes) // using python and easyocr
    {
        // It needs python to be initilized. PythonEngine.Initialize(); PythonEngine.BeginAllowThreads();
        var result = "";
        using (Py.GIL())
        {
            dynamic np = Py.Import("numpy");
            dynamic cv2 = Py.Import("cv2");
            dynamic easyocr = Py.Import("easyocr");

            dynamic nparr = np.frombuffer(imageBytes, np.uint8);
            dynamic img = cv2.imdecode(nparr, cv2.IMREAD_COLOR);
            dynamic gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY);
            dynamic thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2);
            dynamic kernel = np.ones(new int[] { 2, 2 }, np.uint8);
            dynamic clean = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel);
            
            cv2.imwrite("preprocessed.png", clean); // Optionally persist this preprocessed image for inspection

            dynamic reader = easyocr.Reader(new string[] { "en" }, gpu: false);
            dynamic ocrResults = reader.readtext(clean);
            foreach (dynamic item in ocrResults)
            {
                // item structure: [bbox, text, confidence]
                string raw = item[1]?.ToString() ?? string.Empty;
                if (!float.TryParse(item[2]?.ToString(), out float confidence)) continue;
                string normalized = raw.Replace(" ", "").Replace("$", "S").Replace(">", "7").Replace("^", "1");
                Console.WriteLine($"RAW: '{raw}' CONF: {confidence}");
                result += normalized;
                if (result.Length == 5) result = result[1..]; // it has a border on the left and top sides, and it is reading it as a letter very often
                if (result.Length >= 4) break;
            }
        }

        return result;
    }
}
