import fs from 'fs';
import path from 'path';

export interface BaseDoc {
  _id: string;
  [key: string]: any;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

class LocalStore {
  private data: Record<string, BaseDoc[]> = {};
  private initialized = false;

  private ensureLoaded() {
    if (this.initialized) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      }
    } catch {
      this.data = {};
    }
    this.initialized = true;
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch {
      // ignore write errors in constrained envs
    }
  }

  public collection<T extends BaseDoc>(name: string) {
    this.ensureLoaded();
    if (!this.data[name]) {
      this.data[name] = [];
    }
    const collectionData = this.data[name];

    return {
      find: (filter: Record<string, any> = {}) => {
        const filtered = collectionData.filter(item => matchFilter(item, filter));
        return {
          toArray: async () => JSON.parse(JSON.stringify(filtered)) as T[],
          sort: (sortObj: Record<string, 1 | -1>) => {
            const sorted = [...filtered].sort((a, b) => {
              for (const key of Object.keys(sortObj)) {
                const direction = sortObj[key];
                if (a[key] < b[key]) return direction === 1 ? -1 : 1;
                if (a[key] > b[key]) return direction === 1 ? 1 : -1;
              }
              return 0;
            });
            return {
              toArray: async () => JSON.parse(JSON.stringify(sorted)) as T[]
            };
          }
        };
      },

      findOne: async (filter: Record<string, any> = {}): Promise<T | null> => {
        const item = collectionData.find(d => matchFilter(d, filter));
        return item ? (JSON.parse(JSON.stringify(item)) as T) : null;
      },

      insertOne: async (doc: any) => {
        const newDoc = {
          _id: doc._id || `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          ...doc
        };
        collectionData.push(newDoc);
        this.save();
        return { insertedId: newDoc._id, acknowledged: true };
      },

      insertMany: async (docs: any[]) => {
        const insertedIds: string[] = [];
        for (const doc of docs) {
          const newDoc = {
            _id: doc._id || `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            ...doc
          };
          collectionData.push(newDoc);
          insertedIds.push(newDoc._id);
        }
        this.save();
        return { insertedIds, acknowledged: true };
      },

      updateOne: async (filter: Record<string, any>, update: { $set?: Record<string, any>; $push?: Record<string, any>; $inc?: Record<string, number> }) => {
        const idx = collectionData.findIndex(d => matchFilter(d, filter));
        if (idx === -1) return { matchedCount: 0, modifiedCount: 0 };

        const target = collectionData[idx];
        if (update.$set) {
          Object.assign(target, update.$set);
        }
        if (update.$push) {
          for (const [key, val] of Object.entries(update.$push)) {
            if (!Array.isArray(target[key])) target[key] = [];
            target[key].push(val);
          }
        }
        if (update.$inc) {
          for (const [key, val] of Object.entries(update.$inc)) {
            target[key] = (target[key] || 0) + val;
          }
        }
        this.save();
        return { matchedCount: 1, modifiedCount: 1 };
      },

      updateMany: async (filter: Record<string, any>, update: { $set?: Record<string, any>; $push?: Record<string, any>; $inc?: Record<string, number> }) => {
        let modifiedCount = 0;
        for (const target of collectionData) {
          if (matchFilter(target, filter)) {
            if (update.$set) {
              Object.assign(target, update.$set);
            }
            if (update.$push) {
              for (const [key, val] of Object.entries(update.$push)) {
                if (!Array.isArray(target[key])) target[key] = [];
                target[key].push(val);
              }
            }
            if (update.$inc) {
              for (const [key, val] of Object.entries(update.$inc)) {
                target[key] = (target[key] || 0) + val;
              }
            }
            modifiedCount++;
          }
        }
        if (modifiedCount > 0) this.save();
        return { matchedCount: modifiedCount, modifiedCount };
      },

      deleteOne: async (filter: Record<string, any>) => {
        const idx = collectionData.findIndex(d => matchFilter(d, filter));
        if (idx === -1) return { deletedCount: 0 };
        collectionData.splice(idx, 1);
        this.save();
        return { deletedCount: 1 };
      },

      deleteMany: async (filter: Record<string, any>) => {
        const initialCount = collectionData.length;
        this.data[name] = collectionData.filter(d => !matchFilter(d, filter));
        this.save();
        return { deletedCount: initialCount - this.data[name].length };
      },

      countDocuments: async (filter: Record<string, any> = {}) => {
        return collectionData.filter(d => matchFilter(d, filter)).length;
      }
    };
  }
}

function matchFilter(item: Record<string, any>, filter: Record<string, any>): boolean {
  for (const [key, value] of Object.entries(filter)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('$in' in value) {
        if (!Array.isArray(value.$in)) return false;
        const itemVal = item[key];
        if (Array.isArray(itemVal)) {
          if (!itemVal.some(v => value.$in.includes(v))) return false;
        } else {
          if (!value.$in.includes(itemVal)) return false;
        }
      } else if ('$ne' in value) {
        if (item[key] === value.$ne) return false;
      }
    } else {
      if (item[key] !== value) return false;
    }
  }
  return true;
}

export const localStore = new LocalStore();
