export const currentUser = {
	id: 1,
	username: "alex-dev",
	name: "Alex Developer",
	email: "alex@example.com",
	avatar: "https://i.pravatar.cc/96?img=12",
	bio: "Building useful things on the web.",
	location: "Remote",
	website: "https://example.com",
	followers: 128,
	following: 42,
	repositories: 12,
};

export const users = [currentUser];

export const recentActivity = [
	{
		id: 1,
		type: "commit",
		text: "pushed a commit to",
		target: "mygit",
		time: "2 hours ago",
	},
	{
		id: 2,
		type: "star",
		text: "starred",
		target: "frontend2",
		time: "Yesterday",
	},
];

export const contributionData = Array.from({ length: 52 }, () =>
	Array.from({ length: 7 }, () => Math.floor(Math.random() * 5)),
);

export function getUserByUsername(username) {
	return users.find((user) => user.username === username);
}
