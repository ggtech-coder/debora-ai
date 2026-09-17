import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const copilotSuggest = async (deal) => {
  const { data } = await axios.post(`${API}/copilot/suggest`, { deal }, { timeout: 60000 });
  return data.text;
};

export const copilotSummarize = async (client_name, conversation) => {
  const { data } = await axios.post(`${API}/copilot/summarize`, { client_name, conversation }, { timeout: 60000 });
  return data.text;
};

export const copilotFollowUp = async ({ client_name, context, channel = "whatsapp", tone = "cordial" }) => {
  const { data } = await axios.post(`${API}/copilot/followup`, { client_name, context, channel, tone }, { timeout: 60000 });
  return data.text;
};
