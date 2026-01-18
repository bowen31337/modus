#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000';

async function getAgents() {
  const response = await fetch(`${BASE_URL}/api/v1/agents`);
  const data = await response.json();
  console.log('Agents in data store:');
  data.agents.forEach(agent => {
    console.log(`  - ID: ${agent.id}`);
    console.log(`    Name: ${agent.display_name}`);
    console.log(`    Status: ${agent.status}`);
    console.log('');
  });
}

getAgents().catch(console.error);
