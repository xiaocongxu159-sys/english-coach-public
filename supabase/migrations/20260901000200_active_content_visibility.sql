begin;

-- Registry/database presence is not learner activation. Authenticated learners
-- may only read shared curriculum/content that has explicitly reached the
-- active lifecycle. Service-role operations retain full access for review,
-- import and activation workflows.

drop policy if exists curriculum_versions_authenticated_read on public.curriculum_versions;
drop policy if exists knowledge_nodes_authenticated_read on public.knowledge_nodes;
drop policy if exists knowledge_prerequisites_authenticated_read on public.knowledge_prerequisites;
drop policy if exists lesson_blueprints_authenticated_read on public.lesson_blueprints;
drop policy if exists exercise_templates_authenticated_read on public.exercise_templates;
drop policy if exists exercise_items_authenticated_read on public.exercise_items;

create policy curriculum_versions_authenticated_read
  on public.curriculum_versions for select to authenticated
  using (status = 'active');

create policy knowledge_nodes_authenticated_read
  on public.knowledge_nodes for select to authenticated
  using (
    lifecycle = 'active'
    and exists (
      select 1
      from public.curriculum_versions cv
      where cv.id = knowledge_nodes.curriculum_version_id
        and cv.status = 'active'
    )
  );

create policy knowledge_prerequisites_authenticated_read
  on public.knowledge_prerequisites for select to authenticated
  using (
    exists (
      select 1
      from public.knowledge_nodes node
      join public.curriculum_versions cv
        on cv.id = node.curriculum_version_id
      where node.id = knowledge_prerequisites.node_id
        and node.lifecycle = 'active'
        and cv.status = 'active'
    )
    and exists (
      select 1
      from public.knowledge_nodes prereq
      join public.curriculum_versions cv
        on cv.id = prereq.curriculum_version_id
      where prereq.id = knowledge_prerequisites.prerequisite_node_id
        and prereq.lifecycle = 'active'
        and cv.status = 'active'
    )
  );

create policy lesson_blueprints_authenticated_read
  on public.lesson_blueprints for select to authenticated
  using (
    lifecycle = 'active'
    and exists (
      select 1
      from public.curriculum_versions cv
      where cv.id = lesson_blueprints.curriculum_version_id
        and cv.status = 'active'
    )
  );

create policy exercise_templates_authenticated_read
  on public.exercise_templates for select to authenticated
  using (
    lifecycle = 'active'
    and exists (
      select 1
      from public.curriculum_versions cv
      where cv.id = exercise_templates.curriculum_version_id
        and cv.status = 'active'
    )
  );

create policy exercise_items_authenticated_read
  on public.exercise_items for select to authenticated
  using (
    lifecycle = 'active'
    and trust_class in ('reviewed_core', 'validated_variant')
    and exists (
      select 1
      from public.exercise_templates template
      join public.curriculum_versions cv
        on cv.id = template.curriculum_version_id
      where template.id = exercise_items.template_id
        and template.lifecycle = 'active'
        and cv.status = 'active'
    )
  );

commit;
