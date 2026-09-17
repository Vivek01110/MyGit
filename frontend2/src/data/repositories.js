export const repositories = [
	{
		id: 1,
		name: "mygit",
		description: "A lightweight Git hosting and collaboration platform.",
		visibility: "Public",
		language: "JavaScript",
		topics: ["git", "react", "node"],
		stars: 24,
		forks: 6,
		watchers: 11,
		updatedAt: "2 hours ago",
		owner: "alex-dev",
		defaultBranch: "main",
	},
	{
		id: 2,
		name: "frontend2",
		description: "The frontend for a GitHub-inspired developer workspace.",
		visibility: "Public",
		language: "JavaScript",
		topics: ["vite", "ui"],
		stars: 12,
		forks: 3,
		watchers: 8,
		updatedAt: "Yesterday",
		owner: "alex-dev",
		defaultBranch: "main",
	},
];

export function getRepositoryById(id) {
	return repositories.find((repository) => String(repository.id) === String(id));
}

export const fileStructure = [
	{
		id: 1,
		type: "folder",
		name: "src",
		children: [
			{ id: 2, type: "file", name: "App.jsx", size: "2 KB" },
			{ id: 3, type: "file", name: "main.jsx", size: "1 KB" },
		],
	},
	{ id: 4, type: "file", name: "package.json", size: "1 KB" },
	{ id: 5, type: "file", name: "README.md", size: "3 KB" },
];

export const pullRequests = [
	{
		id: 1,
		number: 1,
		title: "Add repository search",
		status: "Open",
		author: "alex-dev",
		date: "2 days ago",
		branch: "feature/search",
		target: "main",
	},
];

export const commits = [
	{
		id: 1,
		message: "Add initial repository dashboard",
		author: "alex-dev",
		date: "2 hours ago",
		hash: "a1b2c3d4e5f6",
	},
];
