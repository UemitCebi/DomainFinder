# Domain Finder

## Overview

This is a Node.js application that reads a list of names from a CSV file, performs DuckDuckGo searches to find the corresponding domain names, and saves the results into an output CSV file. The script utilizes Puppeteer for web scraping, along with CSV parsing and writing utilities.

## Features

- Reads input names from a CSV file.
- Cleans and validates the data to ensure accurate processing.
- Performs web searches in parallel using Puppeteer with configurable concurrency.
- Extracts the first domain result for each shop from DuckDuckGo search results.
- Saves the results into an output CSV file.
- Configurable delay and concurrency settings for efficient and controlled processing.

---

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. Install the dependencies:
   ```bash
   pnpm install
   ```

---

## Configuration

The application uses environment variables to configure its behavior. These can be set in a `.env` file or directly in the terminal:

- `INPUT`: Path to the input CSV file (default: `input.csv`)
- `OUTPUT`: Path to the output CSV file (default: `output.csv`)
- `CONCURRENCY`: Number of parallel browser pages to use for searches (default: `5`)
- `DELAY`: Delay (in milliseconds) between processing chunks of searches (default: `2000`)

Example `.env` file:

```env
INPUT=input.csv
OUTPUT=output.csv
CONCURRENCY=5
DELAY=2000
```

---

## Usage

1. Prepare an input CSV file with names. Ensure the names are in the first column.

2. Run the script:

   ```bash
   node index.js
   ```

3. Check the output file (default: `output.csv`) for the results.

---

## Code Structure

### Main Modules:

- **`readAndCleanCSV`**: Reads and cleans the input CSV file.
- **`chunkArray`**: Splits an array into smaller chunks for concurrency.
- **`searchDomains`**: Performs web searches for domains using Puppeteer.
- **`saveToCSV`**: Writes the results to an output CSV file.

### Execution Flow:

1. Read and clean names from the input CSV.
2. Perform DuckDuckGo searches for each name, with configurable concurrency and delay.
3. Save the domain results into an output CSV file.

---

## Example

### Input (`input.csv`):

```csv
Name
Example Name 1
Example Name 2
---
Example Name 3
```

### Output (`output.csv`):

```csv
Name,Domain
Example Name 1,example1.com
Example Name 2,example2.net
Example Name 3,example3.org
```

---

## Notes

- Ensure that Puppeteer has the necessary permissions to launch Chromium (e.g., `--no-sandbox` for certain environments).
- For large inputs, increase the delay or adjust the concurrency to avoid being blocked by search engines.

---

## Dependencies

- [Puppeteer](https://github.com/puppeteer/puppeteer)
- [csv-parser](https://github.com/mafintosh/csv-parser)
- [csv-writer](https://github.com/ryu1kn/csv-writer)

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
