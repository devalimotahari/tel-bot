import fs from 'fs';
import { DATA_ADMIN_FILE_PATH, DATA_DIR_PATH } from '../consistent/paths';

const createRequirementDirectories = () => {
  fs.mkdirSync(DATA_DIR_PATH, { recursive: true });

};

export const loadAdminsFile = (): number[] => {
  let data: number[] = [];
  try {
    const buffer = fs.readFileSync(DATA_ADMIN_FILE_PATH);
    data = JSON.parse(buffer.toString());
  } catch (e) {
    console.error('Error while loading adminsIds file', { error: e });
  }
  return data;
};

export default createRequirementDirectories;