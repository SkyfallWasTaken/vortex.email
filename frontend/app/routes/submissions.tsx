import { useState } from "react";

export function meta() {
	return [
		{ title: "Submissions - Vortex" },
		{
			name: "description",
			content: "Submit and manage repository submissions for Vortex.",
		},
	];
}

interface Submission {
	id: string;
	repo_url: string;
	user_id: string;
	status: "Pending" | "Approved" | "Rejected";
	created_at: string;
	approved_at?: string;
}

export default function Submissions() {
	const [repoUrl, setRepoUrl] = useState("");
	const [userId, setUserId] = useState("");
	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [approvedSubmissions, setApprovedSubmissions] = useState<Submission[]>([]);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");

	const API_BASE = import.meta.env.VITE_API_ENDPOINT || "http://localhost:3000";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setMessage("");

		try {
			const response = await fetch(`${API_BASE}/submissions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					repo_url: repoUrl,
					user_id: userId,
				}),
			});

			if (response.ok) {
				const newSubmission = await response.json();
				setSubmissions(prev => [newSubmission, ...prev]);
				setRepoUrl("");
				setUserId("");
				setMessage("Submission created successfully!");
			} else {
				setMessage("Failed to create submission. Please check your input.");
			}
		} catch (error) {
			setMessage("Error creating submission. Please try again.");
		}

		setLoading(false);
	};

	const loadSubmissions = async () => {
		try {
			const response = await fetch(`${API_BASE}/submissions`);
			if (response.ok) {
				const data = await response.json();
				setSubmissions(data);
			}
		} catch (error) {
			console.error("Failed to load submissions:", error);
		}
	};

	const loadApprovedSubmissions = async () => {
		try {
			const response = await fetch(`${API_BASE}/approved-submissions`);
			if (response.ok) {
				const data = await response.json();
				setApprovedSubmissions(data);
			}
		} catch (error) {
			console.error("Failed to load approved submissions:", error);
		}
	};

	const approveSubmission = async (submissionId: string) => {
		try {
			const response = await fetch(`${API_BASE}/submissions/${submissionId}/approve`, {
				method: "POST",
			});

			if (response.ok) {
				const approvedSubmission = await response.json();
				setSubmissions(prev => prev.filter(s => s.id !== submissionId));
				setApprovedSubmissions(prev => [approvedSubmission, ...prev]);
				setMessage("Submission approved successfully!");
			} else {
				setMessage("Failed to approve submission.");
			}
		} catch (error) {
			setMessage("Error approving submission.");
		}
	};

	return (
		<div className="flex flex-col md:p-6 mx-6 my-6 prose max-w-none">
			<h1 className="mb-0">Repository Submissions</h1>
			<p className="mb-6">
				Submit repository URLs and user IDs for approval. Once approved, they will be stored in the system.
			</p>

			{/* Submission Form */}
			<div className="mb-8 p-6 bg-gray-50 rounded-lg not-prose">
				<h2 className="text-xl font-semibold mb-4">Submit New Repository</h2>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700 mb-1">
							Repository URL
						</label>
						<input
							type="url"
							id="repoUrl"
							value={repoUrl}
							onChange={(e) => setRepoUrl(e.target.value)}
							placeholder="https://github.com/user/repo or https://gitlab.com/user/repo"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>
					<div>
						<label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
							User ID
						</label>
						<input
							type="text"
							id="userId"
							value={userId}
							onChange={(e) => setUserId(e.target.value)}
							placeholder="Enter your user ID"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>
					<button
						type="submit"
						disabled={loading}
						className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
					>
						{loading ? "Submitting..." : "Submit"}
					</button>
				</form>
				{message && (
					<div className={`mt-4 p-3 rounded-md ${message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
						{message}
					</div>
				)}
			</div>

			{/* Load Data Buttons */}
			<div className="mb-6 space-x-4 not-prose">
				<button
					onClick={loadSubmissions}
					className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
				>
					Load Pending Submissions
				</button>
				<button
					onClick={loadApprovedSubmissions}
					className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
				>
					Load Approved Submissions
				</button>
			</div>

			{/* Pending Submissions */}
			{submissions.length > 0 && (
				<div className="mb-8">
					<h2>Pending Submissions</h2>
					<div className="not-prose space-y-4">
						{submissions.map((submission) => (
							<div key={submission.id} className="border border-gray-300 rounded-lg p-4">
								<div className="flex justify-between items-start">
									<div>
										<p><strong>Repository:</strong> <a href={submission.repo_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{submission.repo_url}</a></p>
										<p><strong>User ID:</strong> {submission.user_id}</p>
										<p><strong>Status:</strong> <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">{submission.status}</span></p>
										<p><strong>Created:</strong> {new Date(submission.created_at).toLocaleString()}</p>
									</div>
									<button
										onClick={() => approveSubmission(submission.id)}
										className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
									>
										Approve
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Approved Submissions */}
			{approvedSubmissions.length > 0 && (
				<div>
					<h2>Approved Submissions</h2>
					<p className="mb-4">These repository URLs and user IDs are stored in the system:</p>
					<div className="not-prose space-y-4">
						{approvedSubmissions.map((submission) => (
							<div key={submission.id} className="border border-green-300 rounded-lg p-4 bg-green-50">
								<p><strong>Repository:</strong> <a href={submission.repo_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{submission.repo_url}</a></p>
								<p><strong>User ID:</strong> {submission.user_id}</p>
								<p><strong>Status:</strong> <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">{submission.status}</span></p>
								<p><strong>Approved:</strong> {submission.approved_at ? new Date(submission.approved_at).toLocaleString() : "N/A"}</p>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Storage Information */}
			<div className="mt-8 p-4 bg-blue-50 rounded-lg">
				<h3 className="text-lg font-semibold mb-2">Where Data is Stored</h3>
				<p className="mb-2">Once a submission is approved, the repository URLs and user IDs are stored in Redis with the following keys:</p>
				<ul className="list-disc pl-6 space-y-1">
					<li><code className="bg-gray-100 px-2 py-1 rounded">submission:{"{submission_id}"}</code> - Complete submission data</li>
					<li><code className="bg-gray-100 px-2 py-1 rounded">submissions:approved</code> - List of approved submission IDs</li>
					<li><code className="bg-gray-100 px-2 py-1 rounded">approved:{"{user_id}"}:{"{repo_url}"}</code> - Direct access to approved submission by user and repo</li>
				</ul>
			</div>
		</div>
	);
}