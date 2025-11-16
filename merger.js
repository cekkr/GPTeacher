#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');


/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param {Array<any>} array The array to shuffle.
 */
function shuffleArray(array) {
  // Loop backward from the last element
  for (let i = array.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i (inclusive)
    const j = Math.floor(Math.random() * (i + 1));

    // Swap the elements at indexes i and j
    // This is a concise way to swap using "destructuring assignment"
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * This script scans all immediate subdirectories of its current location.
 * It reads all .json files within those subdirectories, assumes each contains an array,
 * and concatenates all arrays into a single 'total.json' file in the current directory.
 */
async function mergeJsonFromSubfolders() {
  const currentDir = process.cwd();
  let allObjects = [];
  let foldersScanned = 0;
  let filesProcessed = 0;

  console.log(`Scanning subfolders in: ${currentDir}`);

  try {
    // 1. Get all entries in the current directory
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    // 2. Filter for directories
    const subfolders = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    console.log(`Found ${subfolders.length} subfolder(s): ${subfolders.join(', ')}`);
    foldersScanned = subfolders.length;

    // 3. Process each subfolder
    for (const folder of subfolders) {
      const subfolderPath = path.join(currentDir, folder);
      
      try {
        // 4. Find all files in the subfolder
        const files = await fs.readdir(subfolderPath);

        // 5. Filter for .json files
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        // 6. Process each .json file
        for (const jsonFile of jsonFiles) {
          const filePath = path.join(subfolderPath, jsonFile);
          
          try {
            // 7. Read and parse the file
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(fileContent);

            // 8. Add to the main array if it's an array
            if (Array.isArray(data)) {
              allObjects.push(...data);
              filesProcessed++;
              console.log(`  - Processed ${filePath} (found ${data.length} objects)`);
            } else {
              console.warn(`  - Warning: File ${filePath} does not contain an array. Skipping.`);
            }
          } catch (parseErr) {
            console.error(`  - Error: Could not read or parse ${filePath}. ${parseErr.message}`);
          }
        }
      } catch (readDirErr) {
         console.error(`Error: Could not scan subfolder ${folder}. ${readDirErr.message}`);
      }
    }    

    shuffleArray(allObjects)

    // 9. Write the final combined 'total.json' file
    const outputPath = path.join(currentDir, 'GPTeacher.json');
    await fs.writeFile(outputPath, JSON.stringify(allObjects, null, 2));

    console.log('\n--- Summary ---');
    console.log(`Scanned ${foldersScanned} subfolder(s).`);
    console.log(`Processed ${filesProcessed} .json file(s).`);
    console.log(`Successfully combined ${allObjects.length} objects into total.json`);

  } catch (err) {
    console.error(`\nAn unexpected error occurred: ${err.message}`);
    process.exit(1);
  }
}

// Run the script
mergeJsonFromSubfolders();