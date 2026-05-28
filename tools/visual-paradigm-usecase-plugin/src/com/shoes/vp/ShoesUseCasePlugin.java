package com.shoes.vp;

import com.vp.plugin.ApplicationManager;
import com.vp.plugin.DiagramManager;
import com.vp.plugin.ProjectManager;
import com.vp.plugin.VPPlugin;
import com.vp.plugin.VPPluginCommandLineSupport;
import com.vp.plugin.VPPluginInfo;
import com.vp.plugin.diagram.IDiagramElement;
import com.vp.plugin.diagram.IUseCaseDiagramUIModel;
import com.vp.plugin.diagram.connector.IExtendUIModel;
import com.vp.plugin.diagram.connector.IIncludeUIModel;
import com.vp.plugin.diagram.shape.IActorUIModel;
import com.vp.plugin.diagram.shape.ISystemUIModel;
import com.vp.plugin.diagram.shape.IUseCaseUIModel;
import com.vp.plugin.model.IActor;
import com.vp.plugin.model.IAssociation;
import com.vp.plugin.model.IExtend;
import com.vp.plugin.model.IInclude;
import com.vp.plugin.model.ISystem;
import com.vp.plugin.model.IUseCase;
import com.vp.plugin.model.factory.IModelElementFactory;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class ShoesUseCasePlugin implements VPPlugin, VPPluginCommandLineSupport {
  private static class ActorRow {
    String name;
    int x;
    int y;
  }

  private static class UseCaseRow {
    String id;
    String name;
    String category;
    int x;
    int y;
    int width;
    int height;
    String actors;
  }

  private static class RelationRow {
    String type;
    String from;
    String to;
  }

  public void loaded(VPPluginInfo info) {
  }

  public void unloaded() {
  }

  public void invoke(String[] args) {
    try {
      Map<String, String> options = parseOptions(args);
      String dataPath = options.get("data");
      String outPath = options.get("out");
      if (dataPath == null || outPath == null) {
        throw new IllegalArgumentException("Missing plugin arguments: data=<tsv>;out=<vpp>");
      }

      List<ActorRow> actors = new ArrayList<ActorRow>();
      List<UseCaseRow> useCases = new ArrayList<UseCaseRow>();
      List<RelationRow> relations = new ArrayList<RelationRow>();
      loadRows(Path.of(dataPath), actors, useCases, relations);
      createProject(actors, useCases, relations, new File(outPath));
      java.lang.System.out.println("Created Visual Paradigm project: " + outPath);
    } catch (Exception error) {
      error.printStackTrace();
      throw new RuntimeException(error);
    }
  }

  private Map<String, String> parseOptions(String[] args) {
    Map<String, String> result = new HashMap<String, String>();
    StringBuilder joined = new StringBuilder();
    if (args != null) {
      for (String arg : args) {
        if (joined.length() > 0) {
          joined.append(";");
        }
        joined.append(arg);
      }
    }

    for (String part : joined.toString().split(";")) {
      int index = part.indexOf('=');
      if (index > 0) {
        result.put(part.substring(0, index).trim(), part.substring(index + 1).trim());
      }
    }
    return result;
  }

  private void loadRows(
    Path path,
    List<ActorRow> actors,
    List<UseCaseRow> useCases,
    List<RelationRow> relations
  ) throws IOException {
    try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
      String line;
      while ((line = reader.readLine()) != null) {
        line = line.trim();
        if (line.isEmpty() || line.startsWith("#")) {
          continue;
        }

        String[] parts = line.split("\\t", -1);
        if ("ACTOR".equals(parts[0])) {
          ActorRow row = new ActorRow();
          row.name = parts[1];
          row.x = Integer.parseInt(parts[2]);
          row.y = Integer.parseInt(parts[3]);
          actors.add(row);
        } else if ("USECASE".equals(parts[0])) {
          UseCaseRow row = new UseCaseRow();
          row.id = parts[1];
          row.name = parts[2];
          row.category = parts[3];
          row.x = Integer.parseInt(parts[4]);
          row.y = Integer.parseInt(parts[5]);
          row.width = Integer.parseInt(parts[6]);
          row.height = Integer.parseInt(parts[7]);
          row.actors = parts.length > 8 ? parts[8] : "";
          useCases.add(row);
        } else if ("REL".equals(parts[0])) {
          RelationRow row = new RelationRow();
          row.type = parts[1];
          row.from = parts[2];
          row.to = parts[3];
          relations.add(row);
        }
      }
    }
  }

  private void createProject(
    List<ActorRow> actorRows,
    List<UseCaseRow> useCaseRows,
    List<RelationRow> relationRows,
    File outFile
  ) {
    ProjectManager projectManager = ApplicationManager.instance().getProjectManager();
    DiagramManager diagramManager = ApplicationManager.instance().getDiagramManager();
    IModelElementFactory factory = IModelElementFactory.instance();

    projectManager.newProject();

    IUseCaseDiagramUIModel diagram = (IUseCaseDiagramUIModel) diagramManager.createDiagram(
      DiagramManager.DIAGRAM_TYPE_USE_CASE_DIAGRAM
    );
    diagram.setName("00 Overall Use Case - Shoes Ecommerce");
    diagram.setDocumentation(
      "Overall use case diagram generated from Shoes Ecommerce requirements. " +
      "Includes actors, associations, include and extend relationships."
    );

    ISystem systemModel = factory.createSystem();
    systemModel.setName("Shoes Ecommerce System");
    ISystemUIModel systemUI = (ISystemUIModel) diagramManager.createDiagramElement(diagram, systemModel);
    systemUI.setBounds(300, 30, 1560, 1510);
    systemUI.setRequestResetCaption(true);

    Map<String, IActor> actorModels = new LinkedHashMap<String, IActor>();
    Map<String, IActorUIModel> actorShapes = new LinkedHashMap<String, IActorUIModel>();
    for (ActorRow row : actorRows) {
      IActor actor = factory.createActor();
      actor.setName(row.name);
      IActorUIModel actorShape = (IActorUIModel) diagramManager.createDiagramElement(diagram, actor);
      actorShape.setBounds(row.x, row.y, 36, 72);
      actorShape.getCaptionUIModel().setBounds(row.x - 38, row.y + 72, 130, 18);
      actorModels.put(row.name, actor);
      actorShapes.put(row.name, actorShape);
    }

    Map<String, IUseCase> useCaseModels = new LinkedHashMap<String, IUseCase>();
    Map<String, IUseCaseUIModel> useCaseShapes = new LinkedHashMap<String, IUseCaseUIModel>();
    for (UseCaseRow row : useCaseRows) {
      IUseCase useCase = factory.createUseCase();
      useCase.setName(row.id + " - " + row.name);
      useCase.setDocumentation("Category: " + row.category);
      systemModel.addUseCase(useCase);
      IUseCaseUIModel shape = (IUseCaseUIModel) diagramManager.createDiagramElement(diagram, useCase);
      shape.setBounds(row.x, row.y, row.width, row.height);
      shape.setRequestResetCaption(true);
      systemUI.addChild(shape);

      useCaseModels.put(row.id, useCase);
      useCaseShapes.put(row.id, shape);
    }

    Set<String> associationKeys = new HashSet<String>();
    for (UseCaseRow row : useCaseRows) {
      if (row.actors == null || row.actors.trim().isEmpty()) {
        continue;
      }
      String[] names = row.actors.split(";");
      for (String actorName : names) {
        actorName = actorName.trim();
        if (actorName.isEmpty() || !actorModels.containsKey(actorName)) {
          continue;
        }
        String key = actorName + "->" + row.id;
        if (associationKeys.contains(key)) {
          continue;
        }
        associationKeys.add(key);
        createAssociation(
          diagramManager,
          factory,
          diagram,
          actorModels.get(actorName),
          useCaseModels.get(row.id),
          actorShapes.get(actorName),
          useCaseShapes.get(row.id)
        );
      }
    }

    for (RelationRow row : relationRows) {
      IUseCase fromModel = useCaseModels.get(row.from);
      IUseCase toModel = useCaseModels.get(row.to);
      IUseCaseUIModel fromShape = useCaseShapes.get(row.from);
      IUseCaseUIModel toShape = useCaseShapes.get(row.to);
      if (fromModel == null || toModel == null || fromShape == null || toShape == null) {
        continue;
      }
      if ("include".equals(row.type)) {
        IInclude include = factory.createInclude();
        include.setFrom(fromModel);
        include.setTo(toModel);
        IIncludeUIModel connector = (IIncludeUIModel) diagramManager.createConnector(
          diagram,
          include,
          fromShape,
          toShape,
          null
        );
        connector.setRequestResetCaption(true);
      } else if ("extend".equals(row.type)) {
        IExtend extend = factory.createExtend();
        extend.setFrom(fromModel);
        extend.setTo(toModel);
        IExtendUIModel connector = (IExtendUIModel) diagramManager.createConnector(
          diagram,
          extend,
          fromShape,
          toShape,
          null
        );
        connector.setRequestResetCaption(true);
      }
    }

    projectManager.saveProjectAs(outFile);
  }

  private void createAssociation(
    DiagramManager diagramManager,
    IModelElementFactory factory,
    IUseCaseDiagramUIModel diagram,
    IActor actor,
    IUseCase useCase,
    IDiagramElement actorShape,
    IDiagramElement useCaseShape
  ) {
    IAssociation association = factory.createAssociation();
    association.setFrom(actor);
    association.setTo(useCase);
    diagramManager.createConnector(diagram, association, actorShape, useCaseShape, null);
  }
}
