def test_application_crud_lifecycle(auth_client_a):
    # 1. Create
    create_res = auth_client_a.post(
        "/api/applications",
        json={
            "company": "Microsoft",
            "role": "Software Development Engineer Intern",
            "application_date": "2026-10-15",
            "deadline": "2026-11-01",
            "status": "Applied",
            "next_action": "Review LeetCode Trees & Graphs for Round 1",
            "notes": "Referred by senior alumni on LinkedIn.",
        },
    )
    assert create_res.status_code == 200
    app_data = create_res.json()
    assert app_data["company"] == "Microsoft"
    assert app_data["status"] == "Applied"
    app_id = app_data["id"]

    # 2. List
    list_res = auth_client_a.get("/api/applications")
    assert list_res.status_code == 200
    assert any(a["id"] == app_id for a in list_res.json())

    # 3. Update
    update_res = auth_client_a.patch(
        f"/api/applications/{app_id}",
        json={"status": "Interview", "next_action": "Technical Interview scheduled for Friday"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "Interview"
    assert update_res.json()["next_action"] == "Technical Interview scheduled for Friday"

    # 4. Delete
    del_res = auth_client_a.delete(f"/api/applications/{app_id}")
    assert del_res.status_code == 200

    # 5. Verify deleted
    list_after = auth_client_a.get("/api/applications").json()
    assert not any(a["id"] == app_id for a in list_after)
