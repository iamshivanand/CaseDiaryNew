// database.ts
import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";
const DATABASE_NAME = "CaseDiary.db";

interface UploadOptions {
  fileName: string;
  fileType: string;
  fileUri: string;
  copyToFilesystem: boolean;
  folderName?: string; // Optional parameter for specifying folder name
  uniqueId: string;
}

const Samplefields = [
  {
    name: "uniqueId",
    type: "string",
    required: true,
  },
  {
    name: "CNRNumber",
    type: "text",
    placeholder: "Enter CNR Number",
    label: " CNR Number",
  },
  {
    name: "CourtName",
    type: "text",
    placeholder: "Enter Court Name",
    label: "Court Name",
    //manual add
  },
  { name: "dateFiled", type: "date", label: "Date Filed" },
  {
    name: "caseType",
    type: "select",
    label: "Case Type",
    options: [
      { label: "Civil", value: "civil" },
      { label: "Criminal", value: "criminal" },
      { label: "Family", value: "family" },
    ],
    //options should be added manually
  },
  {
    name: "CaseNo",
    type: "text",
    placeholder: "Enter Case Number",
    label: "CaseNumber/STNumber",
    //this must also have year field with dropdown and search
  },
  {
    name: "CrimeNo",
    type: "text",
    placeholder: "Enter Crime Number",
    label: "Crime Number",
    //this must also have year field with dropdown and search
  },
  {
    name: "OnBehalfOf",
    type: "text",
    placeholder: "On Behalf of",
    label: "On Behalf of",
    //this should contain the manual add
  },
  {
    name: "FirstParty",
    type: "text",
    placeholder: "Enter First Party",
    label: "Enter First Party",
  },
  {
    name: "OppositeParty",
    type: "text",
    placeholder: "Enter Opposite Party",
    label: "Enter Opposite Party",
  },
  {
    name: "ClientContactNumber",
    type: "text",
    placeholder: "Enter Contact Number",
    label: "Client Contact Number",
  },
  {
    name: "Accussed",
    type: "text",
    placeholder: "Enter Accused Name",
    label: "Accused",
  },
  {
    name: "Undersection",
    type: "text",
    placeholder: "UnderSection",
    label: "UnderSection",
  },
  {
    name: "PoliceStation",
    type: "text",
    placeholder: "Enter Police Station",
    label: "Police Station",
  },
  {
    name: "District",
    type: "select",
    label: "District",
    options: [
      { label: "Bareilly", value: "Bareilly" },
      { label: "Lucknow", value: "Lucknow" },
    ],
    //List all the Districts in india with search
  },
  {
    name: "OppositeAdvocate",
    type: "text",
    label: "Opposite Advocate",
    placeholder: "Opposite Advocate",
  },
  {
    name: "OppAdvocateContactNumber",
    type: "text",
    label: "Opp. Advocate Contact No.",
    placeholder: "Contact Number",
  },
  {
    name: "CaseStatus",
    type: "text",
    label: "Case Status",
    placeholder: " Case Status",
  },
  { name: "PreviousDate", type: "date", label: "Previous Date" },
  { name: "NextDate", type: "date", label: "Next Date" },
  {
    name: "DocumentPath",
    type: "text",
    required: false,
  },
  {
    name: "caseHistory",
    type: "text",
    required: false,
  },

  // Add more fields with different types as needed
];

export const openDatabaseAsync = async () => {
  if (!global.hasOwnProperty("db")) {
    global.db = SQLite.openDatabaseAsync(DATABASE_NAME);
    await createTableAsync(global.db, Samplefields);
  }
  return global.db;
};

export interface FormData {
  id?: number | string;
  caseNumber?: string;
  court?: string;
  dateFiled?: Date;
  caseType?: string;
  // ... other fields as needed
  DocumentPath?: string; // Optional PDF path placeholder
}

export const createTableAsync = async (
  db: SQLite.SQLiteDatabase,
  samplefields: { name: string; type: string; required?: boolean }[]
) => {
  return new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `
          CREATE TABLE IF NOT EXISTS cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ${samplefields
              .map(
                (field) => `${field.name}${field.required ? " NOT NULL" : ""}`
              )
              .join(", ")}
          );
        `,
          [],
          (_, result) => {
            resolve(); // Resolve the promise upon successful table creation
          },
          (_, error) => {
            console.error("Error creating table:", error);
            reject(error); // Reject the promise with the error
            return true;
          }
        );
      },
      // Error callback
      (error) => {
        console.error("Transaction error:", error);
        reject(error); // Reject the promise with the error
        return true; // Return true to signify that the error is handled
      }
    );
  });
};
export const getTableColumnsAsync = async (db: SQLite.Database) => {
  return new Promise<string[]>((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `
          PRAGMA table_info("cases");
          `,
          [],
          (_, result) => {
            const columns: string[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const column = result.rows.item(i);
              if (column) {
                columns.push(column.name);
              }
            }
            resolve(columns);
            // console.log("columns are", columns);
          },
          (_, error) => {
            console.error("Error getting table columns:", error);
            reject(error);
            return true;
          }
        );
      },
      (error) => {
        console.error("Transaction error:", error);
        reject(error);
        return true;
      }
    );
  });
};

export const insertFormAsync = async (
  db: SQLite.Database,
  data: { [key: string]: any }
) => {
  return new Promise<void>((resolve, reject) => {
    // console.log("hello values insetForm", data);
    const fields = Object.keys(data);
    const placeholders = fields.map(() => "?").join(", ");

    db.transaction(
      (tx) => {
        tx.executeSql(
          `
          INSERT INTO cases (${fields.join(", ")})
          VALUES (${placeholders})
        `,
          fields.map((field) => data[field]),
          (_, result) => {
            if (result.rowsAffected === 1) {
              // console.log("Form inserted successfully!");
              return resolve(); // Resolve the promise upon successful insertion
            } else {
              console.warn("Failed to insert form!");
              reject(new Error("Failed to insert form")); // Reject the promise if insertion failed
            }
          },
          (_, error) => {
            console.error("Error inserting form:", error);
            reject(error); // Reject the promise with the error
            return true;
          }
        );
      },
      // Error callback
      (error) => {
        console.error("Transaction error:", error);
        return reject(error); // Reject the promise with the error
      }
    );
  });
};

export const getFormsAsync = async (db: SQLite.Database) => {
  const results = await new Promise<any>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `
        SELECT * FROM cases
      `,
        [],
        (_, result) => {
          // console.log("result is ", result);
          resolve(result.rows); // Resolve the promise with the retrieved rows
        },
        (_, error) => {
          console.error("Error fetching forms:", error);
          reject(error); // Reject the promise with the error
          return true;
        }
      );
    });
  });
  // console.log("All cases", results); // Log the retrieved rows
  return results;
};

export const searchFormsAsync = async (
  db: SQLite.Database,
  searchQuery: string
) => {
  // Filter the fields to include only those that have a "name" property
  const searchableFields = Samplefields.filter((field) => field.name);

  // Generate the WHERE clause based on the searchable fields
  const whereClause = searchableFields
    .map((field) => `${field.name} LIKE ?`)
    .join(" OR ");

  // Generate the placeholders and query parameters
  const placeholders = Array(searchableFields.length).fill("?").join(",");
  const queryParams = searchableFields.map(() => `%${searchQuery}%`);

  const query = `
    SELECT * FROM cases WHERE ${whereClause}
  `;

  const results = await new Promise<any>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        queryParams,
        (_, result) => {
          resolve(result.rows); // Resolve the promise with the retrieved rows
        },
        (_, error) => {
          console.error("Error fetching forms:", error);
          reject(error); // Reject the promise with the error
          return true;
        }
      );
    });
  });
  return results;
};
export const searchFormsAccordingToFieldsAsync = async (
  db: SQLite.Database,
  fieldName: string,
  searchValue: string,
  comparisonOperator: string = "=" 
) => {
  const query = `
    SELECT * FROM cases WHERE ${fieldName} ${comparisonOperator} ?
  `;

  const results = await new Promise<any>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        [searchValue],
        (_, result) => {
          resolve(result.rows); // Resolve the promise with the retrieved rows
        },
        (_, error) => {
          console.error("Error fetching forms:", error);
          reject(error); // Reject the promise with the error
          return true;
        }
      );
    });
  });
  return results;
};

export const updateFormAsync = async (
  db: SQLite.Database,
  uniqueId: string | number,
  data: any
): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    db.transaction(
      (tx) => {
        console.log("Hello from update Database", data.NextDate);

        // First, fetch the current data
        tx.executeSql(
          `SELECT * FROM cases WHERE uniqueId = ?`,
          [uniqueId],
          (_, result) => {
            const currentData = result.rows.item(0);

            if (data?.NextDate && currentData?.NextDate !== data?.NextDate) {
              data.PreviousDate = currentData?.NextDate;

              // Maintain case history
              const history = JSON.parse(currentData?.caseHistory || "[]");
              history.push({
                date: new Date().toISOString(),
                field: "NextDate",
                oldValue: currentData?.NextDate,
                newValue: data?.NextDate,
              });
              data.caseHistory = JSON.stringify(history);
            }

            const updateFields = Object.keys(data)
              .filter((key) => key !== "uniqueId")
              .map((key) => `${key} = ?`)
              .join(", ");
            const values: (string | number)[] = Object.values(data).filter(
              (val): val is string | number => val !== undefined
            );
            console.log("Hello UpdateFields are", updateFields, values);

            if (updateFields.length === 0) {
              console.warn("No fields provided for update.");
              resolve(false);
              return;
            }

            values.push(uniqueId);

            tx.executeSql(
              `
              UPDATE cases
              SET ${updateFields}
              WHERE uniqueId = ?
            `,
              values,
              (_, result) => {
                if (result.rowsAffected === 1) {
                  resolve(true);
                } else {
                  console.warn("Failed to update form!", result);
                  resolve(false);
                }
              },
              (_, error) => {
                console.error("Error updating form:", error);
                reject(error);
                return true;
              }
            );
          },
          (_, error) => {
            console.error("Error fetching current data:", error);
            reject(error);
            return true;
          }
        );
      },
      (error) => {
        console.error("Transaction error:", error);
        reject(error);
      }
    );
  });
};
export const deleteFormAsync = async (db: SQLite.Database, id: string) => {
  db.transaction((tx) => {
    tx.executeSql(
      `
      DELETE FROM cases WHERE id = ?
    `,
      [id]
    );
  });
};

//export const addPdfAttachmentAsync = async (formData: FormData, pdfUri: string) => {
// Implement logic to store the PDF file (e.g., using expo-file-system or react-native-fs)
// based on the pdfUri and update formData.pdfPath with the actual storage location
// formData.pdfPath = /* path where the PDF is stored */
// return formData;
//};
const uploadFile = async (options: UploadOptions) => {
  const {
    fileName,
    fileType,
    fileUri,
    copyToFilesystem,
    folderName,
    uniqueId,
  } = options;

  try {
    const appSandboxUri =
      FileSystem.documentDirectory + `documents/${fileName}.${fileType}`;
    await FileSystem.copyAsync({ from: fileUri, to: appSandboxUri });
    await updateFormAsync(global.db, uniqueId, { DocumentPath: appSandboxUri });
  } catch (error) {
    console.log("Error aa gyaa bhaiya");
  }
};

export default uploadFile;

export const checkFileExists = async (filePath: string) => {
  try {
    const { exists } = await FileSystem.getInfoAsync(filePath);
    return exists;
  } catch (error) {
    console.error("Error checking file existence:", error);
    throw error;
  }
};

export const getSuggestions = async (db: SQLite.Database, fields) => {
  const suggestions = {};
  const fieldsWithNames = fields?.filter((field) => field.name);

  await Promise.all(
    fieldsWithNames.map(async (field) => {
      try {
        const results = await new Promise((resolve, reject) => {
          db.transaction((tx) => {
            tx.executeSql(
              `SELECT DISTINCT ${field.name} FROM cases WHERE ${field.name} IS NOT NULL AND ${field.name} != ''`,
              [],
              (_, result) => {
                const values = new Set();
                for (let i = 0; i < result.rows.length; i++) {
                  values.add(result.rows.item(i)[field.name]);
                }
                resolve(Array.from(values)); // Convert set back to array
              },
              (_, error) => {
                console.error(
                  `Error fetching suggestions for field ${field.name}:`,
                  error
                );
                reject(error);
                return true;
              }
            );
          });
        });

        suggestions[field.name] = results;
      } catch (error) {
        console.error(
          `Error fetching suggestions for field ${field.name}:`,
          error
        );
      }
    })
  );

  return suggestions;
};

export const fetchFieldsAsync = async (
  db: SQLite.Database,
  fields: string[]
): Promise<any[]> => {
  // Validate that the fields exist in the Samplefields array
  const validFields = fields.filter((field) =>
    Samplefields.some((sampleField) => sampleField.name === field)
  );

  if (validFields.length === 0) {
    throw new Error("No valid fields specified.");
  }

  // Generate the SELECT clause
  const selectClause = validFields.join(", ");

  const query = `SELECT ${selectClause} FROM cases`;

  // Execute the query and fetch the data
  const results = await new Promise<any[]>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        [],
        (_, result) => {
          const rows = [];
          for (let i = 0; i < result.rows.length; i++) {
            rows.push(result.rows.item(i));
          }
          resolve(rows); // Resolve the promise with the retrieved rows
        },
        (_, error) => {
          console.error("Error fetching fields:", error);
          reject(error); // Reject the promise with the error
          return true;
        }
      );
    });
  });

  return results;
};
