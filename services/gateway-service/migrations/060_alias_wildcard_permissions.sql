-- Seed alias wildcard permissions for school-side menu visibility
-- These keys are used by the frontend v-if checks like has('overview.*')

insert ignore into permissions(`key`, label) values
('overview.*', '总览模块（全部）'),
('daily.*', '日常运营模块（全部）'),
('inventory.*', '出入库模块（全部）'),
('hr.*', '资质证件模块（全部）'),
('bright.*', '明厨亮灶模块（全部）'),
('system.*', '系统配置（全部）');

