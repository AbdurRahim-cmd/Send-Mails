// modules/jobs/parsers/index.js

import * as linkedin from "./linkedin.parser.js";
import * as naukri from "./naukri.parser.js";
import * as glassdoor from "./glassdoor.parser.js";
import * as indeed from "./indeed.parser.js";
import * as wellfound from "./wellfound.parser.js";

const PARSERS = {
  linkedin: linkedin.parse,
  naukri: naukri.parse,
  glassdoor: glassdoor.parse,
  indeed: indeed.parse,
  wellfound: wellfound.parse,
};

export const getParser = (portalName) => PARSERS[portalName] || null;
