import React from "react";
import DashboardParticipantesBase from "../../common/DashboardParticipantesBase";
import { getVigenciaConfig } from "../../../config/vigencias";

const YEAR = "2025";
const config = getVigenciaConfig(YEAR, "participantes");

const DashboardParticipantes = ({ setParticipantesGlobal }) => (
  <DashboardParticipantesBase
    year={YEAR}
    config={config}
    setParticipantesGlobal={setParticipantesGlobal}
  />
);

export default DashboardParticipantes;
