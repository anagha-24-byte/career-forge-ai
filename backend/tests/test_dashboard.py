from tests.test_resumes import create_sample_docx_bytes


def test_dashboard_summary_reflects_actual_db_records(auth_client_a, user_a):
    # 1. New user has empty summary
    init_res = auth_client_a.get("/api/dashboard/summary")
    assert init_res.status_code == 200
    init_data = init_res.json()
    assert init_data["greeting_name"] == user_a.name
    assert init_data["latest_resume_score"] is None
    assert init_data["latest_job_match_score"] is None
    assert init_data["active_applications_count"] == 0

    # 2. Add application
    auth_client_a.post(
        "/api/applications",
        json={
            "company": "Amazon",
            "role": "SDE Intern",
            "application_date": "2026-10-14",
            "deadline": "2026-10-30",
            "status": "Applied",
        },
    )

    # 3. Upload & analyze resume
    file_bytes = create_sample_docx_bytes()
    upload_res = auth_client_a.post(
        "/api/resumes",
        files={"file": ("dash_resume.docx", file_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    resume_id = upload_res.json()["id"]
    analyze_res = auth_client_a.post(
        f"/api/resumes/{resume_id}/analyze",
        json={"target_role": "Backend Engineer"},
    )
    resume_score = analyze_res.json()["overall_score"]

    # 4. Check summary reflects accurate data
    dash_res = auth_client_a.get("/api/dashboard/summary")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["active_applications_count"] == 1
    assert dash_data["latest_resume_score"] == resume_score
    assert len(dash_data["upcoming_deadlines"]) == 1
    assert dash_data["upcoming_deadlines"][0]["company"] == "Amazon"
    assert len(dash_data["recent_activity"]) >= 1
