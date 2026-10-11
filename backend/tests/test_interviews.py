def test_mock_interview_flow(auth_client_a):
    # 1. Start interview
    start_res = auth_client_a.post(
        "/api/interviews",
        json={
            "target_role": "Backend Engineer",
            "interview_type": "technical",
            "difficulty": "intermediate",
            "question_count": 3,
        },
    )
    assert start_res.status_code == 200
    session_data = start_res.json()
    assert session_data["status"] == "in_progress"
    assert session_data["total_questions"] == 3
    assert len(session_data["questions_json"]) == 3
    session_id = session_data["id"]

    # 2. Submit answer to question 1
    ans_res = auth_client_a.post(
        f"/api/interviews/{session_id}/answers",
        json={
            "question_number": 1,
            "answer_text": (
                "In my projects, I use a layered architecture with FastAPI routers, domain service classes, "
                "and SQLAlchemy ORM models. For concurrency, I ensure ACID guarantees with database transactions "
                "and use connection pooling to manage load efficiently."
            ),
        },
    )
    assert ans_res.status_code == 200
    updated_session = ans_res.json()
    assert len(updated_session["answers"]) == 1
    feedback = updated_session["answers"][0]["feedback_json"]
    assert "clarity_score" in feedback
    assert "technical_depth_score" in feedback
    assert "strengths" in feedback
    assert "sample_strong_answer" in feedback

    # 3. Complete interview
    comp_res = auth_client_a.post(f"/api/interviews/{session_id}/complete")
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["status"] == "completed"
    assert comp_data["overall_score"] is not None
    assert comp_data["overall_feedback"] is not None
