export const issues = [
	{
		id: 1,
		number: 1,
		title: "Add repository search",
		status: "Open",
		labels: ["enhancement"],
		createdDate: "2 days ago",
		author: "alex-dev",
		authorAvatar: "https://i.pravatar.cc/48?img=12",
		comments: 3,
		description: "Add filtering for repository name, description, and language.",
	},
	{
		id: 2,
		number: 2,
		title: "Improve empty states",
		status: "Closed",
		labels: ["design"],
		createdDate: "5 days ago",
		author: "alex-dev",
		authorAvatar: "https://i.pravatar.cc/48?img=12",
		comments: 1,
		description: "Show a useful message when a list has no results.",
	},
];

export const issueComments = {
	1: [
		{
			id: 1,
			author: "alex-dev",
			authorAvatar: "https://i.pravatar.cc/48?img=12",
			body: "This is ready for feedback.",
			createdDate: "Yesterday",
		},
	],
};

export function getIssuesByRepository() {
	return issues;
}

export function getIssueById(id) {
	return issues.find((issue) => String(issue.id) === String(id));
}
