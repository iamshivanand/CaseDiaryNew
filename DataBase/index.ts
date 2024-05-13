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
  documentData: any;
}

const Samplefields = [
  {
    name: "uniqueId",
    type: "string",
    required: true,
  },
  {
    name: "CRNNumber",
    type: "text",
    placeholder: "Enter CRN Number",
    label: " CRN Number",
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

  // Add more fields with different types as needed
];

export const openDatabaseAsync = async () => {
  if (!global.hasOwnProperty("db")) {
    global.db = SQLite.openDatabase(DATABASE_NAME);
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
  db: SQLite.Database,
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
            console.log("Table created successfully!");
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
            console.log("columns are", columns);
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
    console.log("hello values insetForm", data);
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
              console.log("Form inserted successfully!");
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
          console.log("result is ", result);
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

export const updateFormAsync = async (
  db: SQLite.Database,
  id: string | number,
  data: FormData
): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    db.transaction(
      (tx) => {
        const updateFields = Object.keys(data)
          .filter((key) => key !== "id")
          .map((key) => `${key} = ?`)
          .join(", ");
        const values = Object.values(data).filter((val) => val !== undefined); // Filter out undefined values
        console.log("values in update function", updateFields);

        // Ensure we have at least one field to update
        if (updateFields.length === 0) {
          console.warn("No fields provided for update.");
          resolve(false); // Indicate failure
          return;
        }

        values.push(id); // Add id for WHERE clause

        tx.executeSql(
          `
          UPDATE cases
          SET ${updateFields}
          WHERE uniqueId = ?
        `,
          values,
          (_, result) => {
            if (result.rowsAffected === 1) {
              console.log("Form updated successfully!");
              resolve(true); // Indicate success
            } else {
              console.warn("Failed to update form!", result);
              resolve(false); // Indicate failure
            }
          }
        );
      },
      // Error callback
      (error) => {
        console.error("Transaction error:", error);
        reject(error); // Reject the promise with the error
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
    documentData,
  } = options;
  const directory = FileSystem.documentDirectory + "Documents/";

  try {
    const base64Content = documentData.toString("base64");
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const savedUri = directory + fileName + `.${fileType}`;
    const hello = await FileSystem.writeAsStringAsync(savedUri, base64Content, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // console.log("Upload Hello", hello);
    updateFormAsync(global.db, uniqueId, { DocumentPath: savedUri });
    return savedUri;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
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
