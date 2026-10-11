def test_generate_and_update_roadmap(auth_client_a):
    # 1. Generate roadmap
    gen_res = auth_client_a.post(
        "/api/roadmaps",
        json={
            "target_role": "Full Stack Developer",
            "target_domain": "Cloud Platforms",
        },
    )
    assert gen_res.status_code == 200
    roadmap_data = gen_res.json()
    assert roadmap_data["target_role"] == "Full Stack Developer"
    assert len(roadmap_data["tasks"]) > 0
    assert roadmap_data["progress_percentage"] == 0

    roadmap_id = roadmap_data["id"]
    first_task = roadmap_data["tasks"][0]
    task_id = first_task["id"]

    # 2. Get latest roadmap
    latest_res = auth_client_a.get("/api/roadmaps/latest")
    assert latest_res.status_code == 200
    assert latest_res.json()["id"] == roadmap_id

    # 3. Toggle task completed
    toggle_res = auth_client_a.patch(
        f"/api/roadmap-tasks/{task_id}",
        json={"is_completed": True},
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_completed"] is True

    # 4. Verify parent roadmap recalculated progress
    updated_roadmap = auth_client_a.get(f"/api/roadmaps/{roadmap_id}").json()
    assert updated_roadmap["progress_percentage"] > 0

    # 5. Add custom task
    add_res = auth_client_a.post(
        f"/api/roadmaps/{roadmap_id}/tasks",
        json={
            "milestone_title": "Capstone Placement Project",
            "task_title": "Deploy on AWS ECS / Render",
            "description": "Configure environment variables and database migrations.",
            "difficulty_level": "Intermediate",
            "estimated_hours": 12,
        },
    )
    assert add_res.status_code == 200
    assert add_res.json()["task_title"] == "Deploy on AWS ECS / Render"
