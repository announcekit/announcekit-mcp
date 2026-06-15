/**
 * list_projects — Lists the projects the user can access.
 * Usually called first, since other tools need a project_id.
 */

import { defineTool } from "../core/tool.js";

interface MeProjects {
  me: {
    memberships: Array<{
      member_role: string;
      project: { id: string; name: string; slug: string; website?: string };
    }>;
  };
}

export default defineTool({
  name: "list_projects",
  title: "List Projects",
  description:
    "Lists the Announcekit projects the user can access. Use this to get the " + "project_id needed to create/list posts or fetch statistics.",
  inputSchema: {},
  handler: async (_args, { client }) => {
    const data = await client.graphql<MeProjects>(
      `query ListProjects {
         me { memberships { member_role project { id name slug website } } }
       }`
    );
    const projects = data.me.memberships.map((m) => ({
      ...m.project,
      role: m.member_role,
    }));
    return { count: projects.length, projects };
  },
});
