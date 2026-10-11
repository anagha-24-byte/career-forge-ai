from tests.test_resumes import create_sample_docx_bytes


def test_user_b_cannot_access_user_a_resources(auth_client_a, auth_client_b):
    # User A creates a resume
    file_bytes = create_sample_docx_bytes("User A Private Project Resume")
    res_a = auth_client_a.post(
        "/api/resumes",
        files={"file": ("secret_resume_a.docx", file_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    resume_a_id = res_a.json()["id"]

    # User A creates an application
    app_a = auth_client_a.post(
        "/api/applications",
        json={
            "company": "Confidential Corp",
            "role": "Top Secret Engineer",
            "application_date": "2026-10-12",
            "status": "Applied",
        },
    ).json()
    app_a_id = app_a["id"]

    # User A creates a job match
    match_a = auth_client_a.post(
        "/api/job-matches",
        json={
            "job_title": "Confidential Lead",
            "job_description": "Building confidential systems with Python and SQL.",
            "resume_id": resume_a_id,
        },
    ).json()
    match_a_id = match_a["id"]

    # User A creates a roadmap
    roadmap_a = auth_client_a.post(
        "/api/roadmaps",
        json={"target_role": "Confidential Specialist"},
    ).json()
    roadmap_a_id = roadmap_a["id"]
    task_a_id = roadmap_a["tasks"][0]["id"]

    # User A creates an interview session
    interview_a = auth_client_a.post(
        "/api/interviews",
        json={
            "target_role": "Confidential Architect",
            "interview_type": "technical",
            "difficulty": "advanced",
            "question_count": 3,
        },
    ).json()
    interview_a_id = interview_a["id"]

    # ================= USER B ATTEMPTS =================

    # 1. User B tries to view or delete User A's resume
    assert auth_client_b.get(f"/api/resumes/{resume_a_id}").status_code == 404
    assert auth_client_b.delete(f"/api/resumes/{resume_a_id}").status_code == 404

    # 2. User B tries to view or delete User A's application
    assert auth_client_b.patch(f"/api/applications/{app_a_id}", json={"status": "Rejected"}).status_code == 404
    assert auth_client_b.delete(f"/api/applications/{app_a_id}").status_code == 404

    # 3. User B tries to view or delete User A's job match
    assert auth_client_b.get(f"/api/job-matches/{match_a_id}").status_code == 404
    assert auth_client_b.delete(f"/api/job-matches/{match_a_id}").status_code == 404

    # 4. User B tries to view User A's roadmap or update task
    assert auth_client_b.get(f"/api/roadmaps/{roadmap_a_id}").status_code == 404
    assert auth_client_b.patch(f"/api/roadmap-tasks/{task_a_id}", json={"is_completed": True}).status_code == 404

    # 5. User B tries to view User A's interview or submit answers
    assert auth_client_b.get(f"/api/interviews/{interview_a_id}").status_code == 404
    assert auth_client_b.post(
        f"/api/interviews/{interview_a_id}/answers",
        json={"question_number": 1, "answer_text": "Unauthorized answer"},
    ).status_code == 404

    # 6. User B's history must not leak User A's items
    history_b = auth_client_b.get("/api/history").json()
    assert not any(r["id"] == resume_a_id for r in history_b["resumes"])
    assert not any(a["id"] == app_a_id for a in history_b["applications"])
    assert not any(m["id"] == match_a_id for m in history_b["matches"])
    assert not any(rd["id"] == roadmap_a_id for rd in history_b["roadmaps"])
    assert not any(i["id"] == interview_a_id for i in history_b["interviews"])
