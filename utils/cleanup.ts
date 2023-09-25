import fs from 'fs';
import { DATA_ADMIN_FILE_PATH } from '../consistent/paths';

process.stdin.resume();//so the program will not close instantly

const handleCleanUp = (options: { adminIds: number[] }) => {
  fs.writeFileSync(DATA_ADMIN_FILE_PATH, JSON.stringify(options.adminIds));
  return true;
};
export default handleCleanUp;