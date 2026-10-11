from tests.test_resumes import create_sample_docx_bytes


def test_create_and_list_job_match(auth_client_a):
    # Upload resume first
    file_bytes = create_sample_docx_bytes()
    upload_res = auth_client_a.post(
        "/api/resumes",
        files={"file": ("tech_resume.docx", file_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    resume_id = upload_res.json()["id"]

    # Run job match
    match_res = auth_client_a.post(
        "/api/job-matches",
        json={
            "job_title": "Backend Engineering Intern",
            "company_name": "Acme Tech",
            "job_description": "We are looking for an intern proficient in Python, FastAPI, Docker, and SQL to build REST APIs.",
            "resume_id": resume_id,
        },
    )
    assert match_res.status_code == 200
    data = match_res.json()
    assert data["job_title"] == "Backend Engineering Intern"
    assert data["company_name"] == "Acme Tech"
    assert 0 <= data["match_score"] <= 100
    result_json = data["result_json"]
    assert "matching_skills" in result_json
    assert "concrete_recommendations" in result_json
    assert "interview_prep_topics" in result_json
    match_id = data["id"]

    # Get single match
    get_res = auth_client_a.get(f"/api/job-matches/{match_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == match_id

    # List matches
    list_res = auth_client_a.get("/api/job-matches")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # Delete match
    del_res = auth_client_a.delete(f"/api/job-matches/{match_id}")
    assert del_res.status_code == 200

    # Verify deleted
    get_after = auth_client_a.get(f"/api/job-matches/{match_id}")
    assert get_after.status_code == 404
